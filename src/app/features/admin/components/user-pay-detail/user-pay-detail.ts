import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { environment } from '../../../../../environments/environment';

registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-user-pay-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-pay-detail.html',
  styleUrls: ['./user-pay-detail.css']
})
export class UserPayDetail implements OnInit {
  user: any = null;
  pago: any = { 
    monto_pagado: 0, 
    monto_pendiente_db: 0, 
    monto_recargo: 0, 
    nuevo_monto_pendiente: 0,
    Tipo_pago: 'Mensual', // Valor inicial por defecto
    proximo_corte: null
  };
  
  clave_usuario!: string;
  montoInicialTotal: number = 0;
  busqueda: string = '';
  resultadosBusqueda: any[] = [];
  mostrarModalPromos: boolean = false;
  promociones: any[] = [];
  nuevaPromo = { meses: null as any, precio: null as any };
  toast = { visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' };

  Math = Math;

  constructor(private route: ActivatedRoute, private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.clave_usuario = String(this.route.snapshot.paramMap.get('clave_usuario'));
    if (this.clave_usuario && this.clave_usuario !== 'null') {
      this.cargarTodo(this.clave_usuario);
    }
  }

cargarTodo(clave: string) {
    this.usuarioService.getUsuarioByClave(clave).subscribe((data: any) => {
      this.user = data;
      if (this.user) {
        this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
        if (this.user.sede) this.cargarListaPromociones();
      }

      this.usuarioService.getPagosByClave(clave).subscribe((pagoData: any) => {
        // Guardamos el objeto completo
        this.pago = pagoData || {};

        // --- EL CAMBIO CLAVE ESTÁ AQUÍ ---
        // Guardamos los valores ORIGINALES de la base de datos en variables nuevas
        this.pago.monto_pendiente_db = Number(this.pago.monto_pendiente ?? 0);
        this.pago.monto_recargo_db = Number(this.pago.monto_recargo ?? 0);
        
        // Limpiamos el monto_pagado para que el input empiece en 0
        this.pago.monto_pagado = 0; 
        
        this.inicializarCalculos();
      });
    });
  }  


inicializarCalculos() {
    if (!this.pago || !this.user) return;

    // Un usuario es nuevo si no tiene fecha de corte previa
    const esNuevo = !this.pago.fecha_corte;

    if (esNuevo) {
      this.pago.monto_recargo = 0;
      // Si es nuevo y no debe nada, asumimos que va a pagar su primer mes ($500)
      this.montoInicialTotal = this.pago.monto_pendiente_db > 0 ? this.pago.monto_pendiente_db : 500;
    } else {
      // SI NO ES NUEVO (como el CLI064), tomamos el recargo que ya calculó Laravel en la DB
      this.pago.monto_recargo = this.pago.monto_recargo_db;
      // Sumamos Deuda Pendiente + Recargo
      this.montoInicialTotal = this.pago.monto_pendiente_db + this.pago.monto_recargo;
    }

    // El monto que falta por cubrir al abrir la pantalla
    this.pago.nuevo_monto_pendiente = this.montoInicialTotal;

    if (this.pago.Tipo_pago === 'Mensual') {
      this.calcularProximaFecha(1);
    }
  }

  onMontoManualChange(valor: any) {
    this.pago.monto_pagado = Number(valor ?? 0);
    
    // Restamos el pago del TOTAL (Deuda + Recargo)
    this.pago.nuevo_monto_pendiente = this.montoInicialTotal - this.pago.monto_pagado;
    
    // Si paga el mes completo o más, sugerimos 1 mes o más
    const meses = this.pago.monto_pagado >= 500 ? Math.floor(this.pago.monto_pagado / 500) : 1;
    this.calcularProximaFecha(meses);
  }

  // ... (aplicarPromo y calcularProximaFecha se mantienen igual)

guardarCambios() {
  // 1. Bloqueo de seguridad: No permitir pagos de 0
  const montoARegistrar = Number(this.pago.monto_pagado || 0);
  
  if (montoARegistrar <= 0) {
    this.showToast('Debes ingresar un monto mayor a $0 para registrar el pago', 'error');
    return; // Detiene la ejecución aquí
  }

  // 2. Si el monto es válido, preparamos el envío
  const payload = {
    monto_pagado: montoARegistrar,
    monto_pendiente: Number(this.pago.nuevo_monto_pendiente || 0),
    fecha_corte: this.pago.proximo_corte,
    // El recargo se limpia solo si el cliente liquidó todo (pendiente + recargo)
    monto_recargo: this.pago.nuevo_monto_pendiente <= 0 ? 0 : this.pago.monto_recargo
  };

  this.usuarioService.actualizarPago(this.clave_usuario, payload).subscribe({
    next: () => {
      this.showToast('¡Pago registrado con éxito!');
      this.cargarTodo(this.clave_usuario);
    },
    error: () => this.showToast('Error al guardar', 'error')
  });
}
  
  aplicarPromo(promo: any) {
    this.pago.Tipo_pago = promo.nombre; // Temporal para la UI
    this.pago.monto_pagado = promo.precio;
    this.pago.nuevo_monto_pendiente = 0; 
    this.calcularProximaFecha(promo.meses);
    this.mostrarModalPromos = false;
    this.showToast(`Promoción "${promo.nombre}" aplicada`);
  }

  reintentarUltimaPromo() {
    const encontrada = this.promociones.find(p => p.nombre === this.pago.Tipo_pago);
    if (encontrada) this.aplicarPromo(encontrada);
    else this.showToast('Promoción no disponible', 'error');
  }

  calcularProximaFecha(meses: number) {
    let fechaBase = this.pago.fecha_corte ? new Date(this.pago.fecha_corte) : new Date();
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);

    const d = nuevaFecha.getDate();
    // REGLA 1 / 15
    if (d >= 23 || d <= 7) {
      nuevaFecha.setDate(1);
    } else {
      nuevaFecha.setDate(15);
    }
    this.pago.proximo_corte = nuevaFecha;
  }


  

  // --- Otros métodos ---
  cargarListaPromociones() {
    this.usuarioService.getPromociones(this.user.sede).subscribe((data: any) => this.promociones = data);
  }

  guardarNuevaPromo() {
    if (this.nuevaPromo.meses > 0 && this.nuevaPromo.precio > 0) {
      const payload = { nombre: `Paquete ${this.nuevaPromo.meses} meses`, meses: this.nuevaPromo.meses, precio: this.nuevaPromo.precio, sede: this.user.sede };
      this.usuarioService.guardarPromocion(payload).subscribe((res: any) => {
        this.promociones.push(res);
        this.nuevaPromo = { meses: null, precio: null };
      });
    }
  }

  eliminarPromo(id: number) {
    this.usuarioService.eliminarPromocion(id).subscribe(() => this.promociones = this.promociones.filter(p => p.id !== id));
  }

  buscar() {
    if (this.busqueda.trim().length < 2) { this.resultadosBusqueda = []; return; }
    this.usuarioService.buscarUsuariosDeSede(this.busqueda, this.user?.sede || '').subscribe(data => this.resultadosBusqueda = data);
  }

  seleccionarUsuario(usuario: any) {
    this.busqueda = '';
    this.resultadosBusqueda = [];
    this.cargarTodo(usuario.clave_usuario);
  }

  limpiarMontoSiEsCero() { if (this.pago.monto_pagado === 0) this.pago.monto_pagado = null; }

  showToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => this.toast.visible = false, 3000);
  }

  get puedeConfirmar(): boolean { 
  return Number(this.pago.monto_pagado) > 0 && !!this.user; 
}
}