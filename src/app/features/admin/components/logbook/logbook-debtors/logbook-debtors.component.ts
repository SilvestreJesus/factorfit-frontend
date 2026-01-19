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


  // --- CORREO ---
openMailModal(user: any) {
  this.isMassEmail.set(false);
  this.selectedUserForMail.set(user);
  
  // Seteamos el asunto y mensaje inicial
  this.asuntoCorreo = 'Aviso de Pago Pendiente - Factor Fit';
  const nombre = user.nombre || user.nombres || 'Usuario';
  const deuda = Number(user.monto_pendiente ?? 0) + Number(user.monto_recargo ?? 0);
  
  this.mensajeCorreo = `Hola ${nombre},\n\nTe informamos que presentas un saldo pendiente de $${deuda}. Te invitamos a regularizar tu situación en la sede ${this.sede}.\n\n¡Saludos!`;
  
  this.showMailModal.set(true);
}

openMassMailModal() {
  this.isMassEmail.set(true);
  // Objeto ficticio para representar a todos
  this.selectedUserForMail.set({ nombre: 'Todos los deudores', email: 'Múltiples Destinatarios' });
  
  this.asuntoCorreo = 'Recordatorio de Pago - Factor Fit';
  this.mensajeCorreo = `Estimados usuarios de Factor Fit Sede ${this.sede},\n\nLes recordamos la importancia de mantenerse al día con sus mensualidades para seguir disfrutando de nuestras instalaciones...`;
  
  this.showMailModal.set(true);
}

enviarCorreo() {
  if (!this.selectedUserForMail()) return;
  this.cargando.set(true);

  // Si es masivo, filtramos los correos de la lista de deudores actual
  const destinatarios = this.isMassEmail() 
    ? this.deudoresFiltrados().map(u => u.email).filter(e => !!e)
    : [this.selectedUserForMail()?.email];

  if (destinatarios.length === 0) {
    this.showToastMessage('No hay correos válidos para enviar', 'error');
    this.cargando.set(false);
    return;
  }

  const payload = {
    emails: destinatarios,
    asunto: this.asuntoCorreo,
    mensaje: this.mensajeCorreo,
    imagen: this.imagenSeleccionada, // Base64 capturado en onFileSelected
    sede: this.sede,
    tipo: 'promocion' // Estilo oscuro profesional
  };

  this.usuarioService.enviarEmail(payload).subscribe({
    next: () => {
      this.showMailModal.set(false);
      this.selectedUserForMail.set(null);
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


  // --- WHATSAPP MASIVO ---
  openWhatsAppMassModal() {
    this.mensajeWhatsApp = `Hola {nombre}, te contactamos de Factor Fit Sede ${this.sede}. Tienes un saldo pendiente de {monto}.`;
    this.showWhatsAppModal.set(true);
  }

  async ejecutarEnvioMasivo() {
    const usuarios = this.deudoresFiltrados();
    if (usuarios.length === 0) return;

    this.totalEnvio.set(usuarios.length);
    this.progresoEnvio.set(0);
    this.cargando.set(true);

    for (const user of usuarios) {
      const tel = user.telefono?.replace(/\D/g, '') || '';
      const numeroFinal = tel.length === 10 ? '521' + tel : tel;
      const deuda = Number(user.monto_pendiente ?? 0) + Number(user.monto_recargo ?? 0);

      const payload = {
        numero: numeroFinal,
        mensaje: this.mensajeWhatsApp
          .replace('{nombre}', user.nombre || user.nombres)
          .replace('{monto}', '$' + deuda)
      };

      try {
        // Usar lastValueFrom si estás en Angular 12+ o toPromise en versiones anteriores
        await this.http.post('https://nodewhatsapp-production.up.railway.app/enviar', payload).toPromise();
        this.progresoEnvio.update(v => v + 1);
      } catch (e) {
        console.error(`Error con ${user.nombre}`, e);
      }
      await new Promise(res => setTimeout(res, 2000));
    }

    this.cargando.set(false);
    this.showWhatsAppModal.set(false);
    this.showToastMessage('¡Envío masivo terminado con éxito!');
  }




  closeMailModal() {
    this.selectedUserForMail.set(null);
    this.mensajeCorreo = '';
  }

  // Nuevas variables de estado
  showToast = false;

  // Método para capturar la imagen
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenSeleccionada = e.target.result; // Esto es el Base64
      };
      reader.readAsDataURL(file);
    }
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

 
// Cambia el nombre a getWhatsAppUrl para que coincida con lo que pusimos en el HTML
getWhatsAppUrl(user: any): string {
  if (!user || !user.telefono) return '#';

  // 1. Limpiamos el número: quitamos '+', espacios y guiones
  // Esto convierte "+52 481 381 2044" en "524813812044"
  const telefonoLimpio = user.telefono.replace(/\D/g, '');

  // 2. Creamos el mensaje
  const mensaje = `Hola *${user.nombres} ${user.apellidos}*, te contactamos de *Factor Fit Sede ${this.sede}* para darte seguimiento.`;

  // 3. Retornamos la URL de WhatsApp
  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
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