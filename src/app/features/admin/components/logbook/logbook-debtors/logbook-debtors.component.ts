import { Component, Input, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-logbook-debtors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logbook-debtors.component.html'
})
export class DebtorsComponent implements OnChanges {

    private usuarioService = inject(UsuarioService);
  private http = inject(HttpClient);
  
  @Input() busqueda = '';
  @Input() sede = ''; 
  
  financialLogData = signal<any[]>([]);
  cargando = signal<boolean>(false);
  
  // Modales
  showMailModal = signal(false);
  showWhatsAppModal = signal(false);
  
  // Control de Envío de Correo
  isMassEmail = signal<boolean>(false);
  selectedUserForMail = signal<any | null>(null);
  
  // Progreso y Notificaciones
  progresoEnvio = signal(0);
  totalEnvio = signal(0);
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });

  // Formulario
  asuntoCorreo = 'Aviso de Pago Pendiente - Factor Fit';
  mensajeCorreo = '';
  mensajeWhatsApp = '';
  imagenSeleccionada: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sede'] && this.sede) {
      this.sincronizarYDescargar();
    }
  }

  sincronizarYDescargar() {
    this.cargando.set(true);
    this.http.get(`${environment.apiUrl}/api/pagos/actualizar?sede=${this.sede}`).subscribe({
      next: () => this.cargarDatos(),
      error: () => this.cargarDatos()
    });
  }
  
  // Propiedades requeridas por tu HTML (Errores TS2339 corregidos)
  esEnvioIndividual = false;
  deudorDestino: any = null;
  constructor() {}

// --- CORRECCIÓN DE LÓGICA DE CORREOS ---

// 1. Abrir para Individual
openMailModal(log: any) {
  this.isMassEmail.set(false);
  this.esEnvioIndividual = true; // Sincronizamos ambas variables
  this.deudorDestino = log;
  this.selectedUserForMail.set(log);

  const monto = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
  this.asuntoCorreo = `Aviso de Adeudo - ${log.nombre}`;
  this.mensajeCorreo = `Hola ${log.nombre},\n\nTe informamos que presentas un saldo pendiente de $${monto}. Te invitamos a regularizar tu cuenta en la sede ${this.sede}.`;
  this.showMailModal.set(true);
}

// 2. Abrir para Masivo
openMassMailModal() {
  this.isMassEmail.set(true);
  this.esEnvioIndividual = false; // Sincronizamos
  this.deudorDestino = null;
  this.selectedUserForMail.set({ nombre: 'Varios Usuarios' });

  this.asuntoCorreo = 'Recordatorio de Pago - Factor Fit';
  this.mensajeCorreo = `Estimados usuarios,\n\nLes recordamos que es importante mantenerse al día con sus pagos para seguir disfrutando de nuestras instalaciones.`;
  this.showMailModal.set(true);
}

// 3. Función ÚNICA de envío (La que llama el botón del modal)
confirmarEnvioCorreo() {
  this.cargando.set(true);

  // Seleccionamos los destinatarios basándonos en la variable isMassEmail
  let destinatarios: string[] = [];
  
  if (this.isMassEmail()) {
    // Caso Masivo: Extraer correos de la lista filtrada
    destinatarios = this.deudoresFiltrados()
      .map(u => u.email)
      .filter(e => !!e && e.includes('@')); // Validar que sea un correo real
  } else {
    // Caso Individual
    const emailIndividual = this.deudorDestino?.email || this.selectedUserForMail()?.email;
    if (emailIndividual) {
      destinatarios = [emailIndividual];
    }
  }

  // Verificación de seguridad
  if (destinatarios.length === 0) {
    this.cargando.set(false);
    this.showToastMessage('No hay correos válidos para enviar', 'error');
    return;
  }

  // Payload para Laravel -> Node
  const payload = {
    emails: destinatarios,
    asunto: this.asuntoCorreo,
    mensaje: this.mensajeCorreo,
    sede: this.sede,
    imagen: this.imagenSeleccionada, // Base64
    tipo: 'html_puro' 
  };

  this.usuarioService.enviarEmail(payload).subscribe({
    next: () => {
      this.showMailModal.set(false);
      this.cargando.set(false);
      this.imagenSeleccionada = null;
      this.showToastMessage(`¡Éxito! Enviado a ${destinatarios.length} destinatario(s)`);
    },
    error: (err) => {
      console.error('Error enviando:', err);
      this.cargando.set(false);
      this.showToastMessage('Error al conectar con el servidor de correos', 'error');
    }
  });
}


  // --- LÓGICA DE WHATSAPP ---

  private prepararNumeroWhatsApp(telefono: string): string {
    if (!telefono) return '';
    let num = telefono.replace(/\D/g, '');
    if (num.length === 10) num = '521' + num;
    else if (num.length === 12 && num.startsWith('52')) num = '521' + num.substring(2);
    return num;
  }

  openWhatsAppMassModal() {
    this.mensajeWhatsApp = "Hola {nombre}, te recordamos que presentas un saldo pendiente de {monto} en Factor Fit Sede " + this.sede + ". ¡Te esperamos!";
    this.showWhatsAppModal.set(true);
  }

  // Nombre de función corregido según tu HTML
  async ejecutarEnvioMasivo() {
    const lista = this.deudoresFiltrados();
    this.totalEnvio.set(lista.length);
    this.progresoEnvio.set(0);
    this.cargando.set(true);

    for (const user of lista) {
      const numeroFinal = this.prepararNumeroWhatsApp(user.telefono);
      const montoTotal = Number(user.monto_pendiente ?? 0) + Number(user.monto_recargo ?? 0);

      if (numeroFinal) {
        const msgPersonalizado = this.mensajeWhatsApp
          .replace(/{nombre}/g, user.nombre)
          .replace(/{monto}/g, `$${montoTotal}`);

        try {
          await this.http.post('http://localhost:3000/enviar', {
            numero: numeroFinal,
            mensaje: msgPersonalizado
          }).toPromise();
        } catch (e) {
          console.error(`Error con ${user.nombre}`, e);
        }
      }
      this.progresoEnvio.update(v => v + 1);
      await new Promise(res => setTimeout(res, 2000));
    }

    this.cargando.set(false);
    this.showWhatsAppModal.set(false);
    this.showToastMessage('¡Envío masivo de WhatsApp completado!');
  }

  // --- LÓGICA DE CORREOS ---

  // Nombre de función corregido según tu HTML
  enviarCorreoIndividual(log: any) {
    this.esEnvioIndividual = true;
    this.deudorDestino = log;
    const monto = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
    
    this.asuntoCorreo = `Aviso de Adeudo - ${log.nombre}`;
    this.mensajeCorreo = `Hola ${log.nombre}, detectamos un saldo pendiente de $${monto}. Te invitamos a regularizarlo.\n\nSede: ${this.sede}`;
    
    this.showMailModal.set(true);
  }


  cargarDatos() {
    this.usuarioService.getBitacoraIngresos(this.sede).subscribe({
      next: (resp) => {
        this.financialLogData.set(resp.data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.financialLogData.set([]);
        this.cargando.set(false);
      }
    });
  }

  deudoresFiltrados = computed(() => {
    const texto = this.busqueda.toLowerCase().trim();
    return this.financialLogData()
      .filter(log => {
        const totalDeuda = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
        const coincide = !texto || log.nombre?.toLowerCase().includes(texto) || log.clave?.toLowerCase().includes(texto);
        return totalDeuda > 0 && coincide;
      });
  });

 


  enviarCorreo() {
    if (!this.selectedUserForMail()) return;
    this.cargando.set(true);

    const destinatarios = this.isMassEmail() 
      ? this.deudoresFiltrados().map(u => u.email).filter(e => !!e)
      : [this.selectedUserForMail()?.email];

    if (destinatarios.length === 0) {
      this.showToastMessage('No hay destinatarios válidos', 'error');
      this.cargando.set(false);
      return;
    }

    const payload = {
      emails: destinatarios,
      asunto: this.asuntoCorreo,
      mensaje: this.mensajeCorreo,
      imagen: this.imagenSeleccionada, // Base64
      sede: this.sede,
      tipo: 'promocion' // Esto activa el cuadro blanco en tu Node
    };

    this.usuarioService.enviarEmail(payload).subscribe({
      next: () => {
        this.showMailModal.set(false);
        this.imagenSeleccionada = null;
        this.cargando.set(false);
        this.showToastMessage('¡Correo enviado con éxito!');
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
        this.showToastMessage('Error al enviar el correo', 'error');
      }
    });
  }

  closeMailModal() {
    this.showMailModal.set(false);
    this.selectedUserForMail.set(null);
    this.imagenSeleccionada = null;
  }

  // --- OTRAS UTILIDADES ---

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagenSeleccionada = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  showToastMessage(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.update(v => ({ ...v, visible: false })), 3000);
  }

  // Lógica de WhatsApp (Igual a la anterior)
  openWhatsApp(log: any) {
    const deuda = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
    const tel = log.telefono?.replace(/\D/g, '');
    const num = tel?.length === 10 ? '521' + tel : tel;
    const msg = encodeURIComponent(`Hola *${log.nombre}*, recordamos tu saldo de *$${deuda}* en Factor Fit.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }
}