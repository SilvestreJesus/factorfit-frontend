import { Component, Input, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../../../core/services/usuario.service';

@Component({
  selector: 'app-logbook-debtors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logbook-debtors.component.html'
})
export class DebtorsComponent implements OnChanges { // Añadimos OnChanges
  private usuarioService = inject(UsuarioService);
  
  @Input() busqueda = '';
  @Input() sede = ''; // Recibimos la sede del padre
  
  financialLogData = signal<any[]>([]);

  // Quitamos la lógica del constructor
  constructor() {}

  // Detectamos cuando llega la sede
  ngOnChanges(changes: SimpleChanges) {
    if (changes['sede'] && this.sede) {
      this.cargarDatos();
    }
  }

// En DebtorsComponent
cargarDatos() {
  if (!this.sede || this.sede === '') return;

  console.log("Cargando deudores para sede:", this.sede); // Para depurar

  this.usuarioService.getBitacoraIngresos(this.sede).subscribe({
    next: (resp) => {
      if (resp.status && resp.data) {
        this.financialLogData.set(resp.data);
      } else {
        this.financialLogData.set([]);
      }
    },
    error: (err) => {
      console.error("Error cargando deudores:", err);
      this.financialLogData.set([]);
    }
  });
}

deudoresFiltrados = computed(() => {
  const texto = this.busqueda.toLowerCase().trim();
  const datos = this.financialLogData();
  
  const filtrados = datos.filter(log => {
    // Sumamos asegurando que si es null, sea 0
    const pendiente = Number(log.monto_pendiente ?? 0);
    const recargo = Number(log.monto_recargo ?? 0);
    const totalDeuda = pendiente + recargo;
    
    // Solo mostrar si realmente debe dinero
    const esDeudor = totalDeuda > 0;
    
    // Filtro de búsqueda
    const coincideBusqueda = !texto || 
                             log.nombre?.toLowerCase().includes(texto) || 
                             log.clave?.toLowerCase().includes(texto);
                             
    return esDeudor && coincideBusqueda;
  });

  return filtrados.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

  
esEnvioIndividual = false;
  deudorDestino: any = null;




  // En logbook-debtors.component.ts

openWhatsApp(log: any) {
  const telefono = log.telefono; // Asegúrate que el objeto log tenga la propiedad telefono
  const nombre = log.nombre || 'Cliente';
  const deuda = (Number(log.monto_pendiente) || 0) + (Number(log.monto_recargo) || 0);
  
  if (!telefono) {
    alert('Este usuario no tiene un número de teléfono registrado.');
    return;
  }

  const mensaje = encodeURIComponent(
    `Hola ${nombre}, te saludamos de Factor Fit. Te recordamos que presentas un saldo pendiente de $${deuda}. ¡Te esperamos!`
  );
  
  window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}
  // --- Modal de Recuperación ---
  showRecoveryModal = signal(false);
  selectedUserForRecovery = signal<any>(null);

  // --- Mensajería Masiva ---
  showMailModal = signal(false);
  showWhatsAppModal = signal(false);
  asuntoCorreo = 'Información Importante - Factor Fit';
  mensajeCorreo = '';
  mensajeWhatsApp = '';
  imagenSeleccionada: string | null = null;

  cargando = signal<boolean>(false);
  
  // Progress para envíos masivos
  progresoEnvio = signal(0);
  totalEnvio = signal(0);

  // --- Toast Signal (Corregido para el HTML) ---
  toast = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({
    visible: false, mensaje: '', tipo: 'success'
  });

  openWhatsAppMassModal() {
    this.mensajeWhatsApp = "Hola {nombre}, te recordamos que tu pago en Factor Fit venció. El monto pendiente es de ${monto}. ¡Te esperamos!";
    this.showWhatsAppModal.set(true);
  }



  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Lógica para previsualizar o cargar imagen
      this.showToastMessage('Imagen seleccionada');
    }
  }

  ejecutarEnvioMasivo() {
    const lista = this.deudoresFiltrados();
    if (lista.length === 0) return;

    this.cargando.set(true);
    this.totalEnvio.set(lista.length);
    this.progresoEnvio.set(0);

    // Simulación de envío (Aquí iría tu lógica de backend)
    const intervalo = setInterval(() => {
      this.progresoEnvio.update(p => p + 1);
      if (this.progresoEnvio() >= this.totalEnvio()) {
        clearInterval(intervalo);
        this.cargando.set(false);
        this.showWhatsAppModal.set(false);
        this.showToastMessage(`Enviados ${this.totalEnvio()} mensajes`, 'success');
      }
    }, 500);
  }


  // --- CORREO INDIVIDUAL ---
  enviarCorreoIndividual(log: any) {
    this.esEnvioIndividual = true;
    this.deudorDestino = log;
    
    // Pre-llenamos el modal con datos específicos (como en tu imagen)
    this.asuntoCorreo = `Aviso de Pago Pendiente - ${log.nombre}`;
    this.mensajeCorreo = `Hola ${log.nombre}, detectamos un saldo pendiente de $${(Number(log.monto_pendiente) + Number(log.monto_recargo))}.`;
    
    this.showMailModal.set(true);
  }

  // --- CORREO MASIVO ---
  openMassMailModal() {
    this.esEnvioIndividual = false;
    this.deudorDestino = null;
    
    // Limpiamos o ponemos un mensaje genérico
    this.asuntoCorreo = 'Aviso de Pago Pendiente - Factor Fit';
    this.mensajeCorreo = 'Estimado cliente, le informamos que presenta un adeudo...';
    
    this.showMailModal.set(true);
  }

  // --- LÓGICA FINAL DE ENVÍO ---
  confirmarEnvioCorreo() {
    if (this.esEnvioIndividual && this.deudorDestino) {
      // AQUÍ LLAMAS A TU SERVICIO PARA UN SOLO CORREO
      console.log(`Enviando correo único a: ${this.deudorDestino.email}`);
      this.showToastMessage(`Correo enviado a ${this.deudorDestino.nombre}`);
    } else {
      // AQUÍ LLAMAS A TU SERVICIO MASIVO
      const total = this.deudoresFiltrados().length;
      console.log(`Enviando correos masivos a ${total} usuarios`);
      this.showToastMessage(`Iniciando envío masivo a ${total} deudores`);
    }
    
    this.showMailModal.set(false);
  }

    showToastMessage(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => {
      this.toast.update(prev => ({ ...prev, visible: false }));
    }, 3000);
  }

}