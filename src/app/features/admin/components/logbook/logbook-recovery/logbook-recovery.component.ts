import { Component, Input, signal, computed, inject, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- Asegúrate que este import esté presente
import { UsuarioService } from '../../../../../core/services/usuario.service';

@Component({
  selector: 'app-logbook-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule], // <--- Debe estar aquí
  templateUrl: './logbook-recovery.component.html'
})

export class RecoveryComponent implements OnChanges {
private usuarioService = inject(UsuarioService);

  @Input() busqueda = '';
  @Input() sede = '';
  
  usersData = signal<any[]>([]);
  financialLogData = signal<any[]>([]);    
  
  showRecoveryModal = signal(false);
  selectedUserForRecovery = signal<any>(null);

  DeudaAnterior = signal<number>(0);
  RecargoAplicado = signal<number>(0);

  // Se ejecuta cada vez que 'sede' cambia
  ngOnChanges(changes: SimpleChanges) {
    if (changes['sede'] && this.sede) {
      this.cargarTodo();
    }
  }

cargarTodo() {
  if (!this.sede) return;

  this.usuarioService.getUsuariosRenovacion(this.sede).subscribe({
    next: (data) => this.usersData.set(data),
  });

  this.usuarioService.getBitacoraRecuperacion(this.sede).subscribe({
    next: (resp) => {
      if (resp.status) {
        this.financialLogData.set(resp.data);
      }
    }
  });
}

  obtenerFechaCorteReal(u: any): string {
    const finData = this.financialLogData().find(f => f.clave === u.clave_usuario);
    return finData?.fecha_corte || u.fecha_corte || '';
  }

  renovacionFiltrados = computed(() => {
    const texto = this.busqueda.toLowerCase().trim();
    return this.usersData().filter(u => {
      // Importante: El estatus debe ser 'eliminado'
      if (u.status !== 'eliminado') return false;
      return !texto || 
             u.nombres?.toLowerCase().includes(texto) || 
             u.clave_usuario?.toString().includes(texto);
    });
  });

  montoARecuperar = computed(() => {
    return Number(this.DeudaAnterior()) + Number(this.RecargoAplicado());
  });

  proximoCorteCalculado = computed(() => {
    const user = this.selectedUserForRecovery();
    if (!user) return null;

    let nuevaFecha = new Date();
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

    const diaFijo = this.getDiaPagoFijo();
    if (diaFijo === 15) {
        nuevaFecha.setDate(15);
    } else {
        nuevaFecha.setDate(1);
    }

    nuevaFecha.setHours(12, 0, 0, 0);
    return nuevaFecha;
  });

  getDiaPagoFijo(): number {
    const user = this.selectedUserForRecovery();
    if (!user) return 1;

    const tipoStr = (user.Tipo_pago || user.tipo_pago || '').toString().toLowerCase();
    if (tipoStr.includes('quincenal')) return 15;
    
    const fechaCortePrevia = this.obtenerFechaCorteReal(user);
    if (fechaCortePrevia) {
      const diaExtraido = new Date(fechaCortePrevia).getDate();
      if (diaExtraido >= 14 && diaExtraido <= 16) return 15;
    }
    return 1;
  }

  abrirPanelRecuperacion(u: any) {
    this.selectedUserForRecovery.set(u);
    
    // Buscamos si tiene datos financieros previos para sugerir el cobro
    const finData = this.financialLogData().find(f => f.clave === u.clave_usuario);
    const pendienteDB = Number(finData?.monto_pendiente ?? 0);
    const recargoDB = Number(finData?.monto_recargo ?? 0);

    if (pendienteDB <= 0) {
      this.DeudaAnterior.set(500);
      this.RecargoAplicado.set(300);
    } else {
      this.DeudaAnterior.set(pendienteDB);
      this.RecargoAplicado.set(recargoDB > 0 ? recargoDB : 300);
    }
    this.showRecoveryModal.set(true);
  }

  selectedUser = signal<any>(null);

  // Estas variables para el formulario NO deben ser signals si las usas con [(ngModel)]
  // o deben manejarse con lógica de actualización manual. 
  // Por simplicidad, usaremos variables normales para el Two-Way Binding:
  deudaAnterior: number = 0;
  
  recargoAplicado: number = 0;

  ngOnInit() {
    this.cargarUsuarios();
  }



  cargarUsuarios() {
    this.usuarioService.getUsuariosRenovacion(this.sede).subscribe({
      next: (data) => this.usersData.set(data),
    });
  }

  // Si necesitas que el total sea reactivo en el HTML:
  get montoTotalRecuperar(): number {
    return Number(this.deudaAnterior) + Number(this.recargoAplicado);
  }

  calcularMontoTotalRenovacion(u: any): number {
    const base = Number(u.monto_pendiente) || 500;
    return base + 300;
  }



eliminarDefinitivo(clave: string) {
  // Eliminamos la confirmación y ejecutamos la petición directamente
  this.usuarioService.eliminarUsuarioPermanente(clave).subscribe({
    next: () => {
      this.mostrarToast('Usuario eliminado permanentemente', 'success');
      this.cargarTodo(); // Recarga las listas para reflejar el cambio
    },
    error: (err) => {
      this.mostrarToast('Error al eliminar el usuario', 'error');
      console.error(err);
    }
  });
}


ajustarDeudaBase() {
  this.DeudaAnterior.set(500);
  this.RecargoAplicado.set(300);
}

  // AÑADIR SEÑAL PARA TOAST
  toast = signal({ visible: false, mensaje: '', tipo: 'success' });

  // ... (ngOnChanges, cargarTodo, etc.)

confirmarRecuperacion() {
  const user = this.selectedUserForRecovery();
  const fechaCalculada = this.proximoCorteCalculado();
  
  if (!user || !fechaCalculada) return;

  // 1. Validar que el monto sea mayor a 0 (Igual que en UserPayDetail)
  const montoARegistrar = this.montoARecuperar();
  if (montoARegistrar <= 0) {
    this.mostrarToast('Debes ingresar un monto mayor a $0', 'error');
    return;
  }

  // 2. Preparamos el payload EXACTO que espera el PagoController->update
  const payload = {
    monto_pagado: montoARegistrar,
    monto_pendiente: 0, // Al renovar, asumimos que liquida la deuda
    monto_recargo: 0,   // Al renovar, limpiamos recargos
    // Formato YYYY-MM-DD para MySQL
    fecha_corte: fechaCalculada.toISOString().split('T')[0] 
  };

  // 3. CAMBIO CLAVE: Usar actualizarPago en lugar de actualizarUsuario
  // Esto es lo que hace que se guarde el dinero y la fecha en la bitácora financiera
  this.usuarioService.actualizarPago(user.clave_usuario, payload).subscribe({
    next: () => {
      this.mostrarToast('¡Renovación y pago registrados con éxito!', 'success');
      this.showRecoveryModal.set(false);
      
      // 4. Recargar todo para que la tabla se actualice y el usuario desaparezca de "Eliminados"
      this.cargarTodo(); 
    },
    error: (err) => {
      this.mostrarToast('Error al guardar en el servidor', 'error');
      console.error(err);
    }
  });
}

  // Función para manejar el mensaje visual
  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => {
      this.toast.set({ visible: false, mensaje: '', tipo: 'success' });
    }, 3000);
  }

  // ... (el resto de tus funciones)
}


