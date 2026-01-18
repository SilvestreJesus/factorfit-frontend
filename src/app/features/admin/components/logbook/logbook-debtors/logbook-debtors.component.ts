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
  
  // Inputs
  @Input() busqueda = '';
  @Input() sede = ''; 
  
  // Datos
  financialLogData = signal<any[]>([]);

  // UI States (Signals para modales y carga)
  cargando = signal<boolean>(false);
  showMailModal = signal(false);
  showWhatsAppModal = signal(false);
  
  // Propiedades requeridas por tu HTML (Errores TS2339 corregidos)
  esEnvioIndividual = false;
  deudorDestino: any = null;

  // Progreso y Notificaciones
  progresoEnvio = signal(0);
  totalEnvio = signal(0);
  toast = signal({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' });

  // Formulario de Mensajería
  asuntoCorreo = 'Aviso de Pago Pendiente - Factor Fit';
  mensajeCorreo = '';
  mensajeWhatsApp = '';
  imagenSeleccionada: string | null = null;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sede'] && this.sede) {
      this.sincronizarYDescargar();
    }
  }

  // --- OBTENCIÓN DE DATOS ---

  sincronizarYDescargar() {
    this.cargando.set(true);
    this.http.get(`${environment.apiUrl}/api/pagos/actualizar?sede=${this.sede}`).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => {
        console.error('Error al sincronizar:', err);
        this.cargarDatos();
      }
    });
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
        const coincideBusqueda = !texto || 
                                 log.nombre?.toLowerCase().includes(texto) || 
                                 log.clave?.toLowerCase().includes(texto);
        return totalDeuda > 0 && coincideBusqueda;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  });

  // --- LÓGICA DE WHATSAPP ---

  private prepararNumeroWhatsApp(telefono: string): string {
    if (!telefono) return '';
    let num = telefono.replace(/\D/g, '');
    if (num.length === 10) num = '521' + num;
    else if (num.length === 12 && num.startsWith('52')) num = '521' + num.substring(2);
    return num;
  }


  

  openWhatsApp(log: any) {
    if (!log.telefono) {
      this.showToastMessage('Este usuario no tiene teléfono registrado', 'error');
      return;
    }
    const deuda = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
    const numeroLimpio = this.prepararNumeroWhatsApp(log.telefono);
    const mensaje = encodeURIComponent(`Hola *${log.nombre}*, te saludamos de *Factor Fit*. Te recordamos que presentas un saldo pendiente de *$${deuda}*. ¡Te esperamos!`);
    window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, '_blank');
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

// --- LÓGICA DE CORREOS (AJUSTADA) ---

  enviarCorreoIndividual(log: any) {
    this.esEnvioIndividual = true;
    this.deudorDestino = log;
    
    // Calculamos el monto total de la deuda
    const monto = Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0);
    
    // Asunto personalizado
    this.asuntoCorreo = `Aviso de Adeudo Pendiente - ${log.nombre}`;
    
    // Cuerpo del mensaje formateado para el cuadro blanco profesional
    this.mensajeCorreo = `Estimado/a ${log.nombre} ${log.apellido},\n\n` +
      `Le informamos que en nuestro sistema de Factor Fit Sede ${this.sede}, ` +
      `detectamos un saldo pendiente por la cantidad de: $${monto.toFixed(2)}.\n\n` +
      `Le invitamos cordialmente a pasar a recepción para regularizar su situación. ` +
      `Si ya realizó su pago, por favor haga caso omiso a este mensaje.`;
    
    this.showMailModal.set(true);
  }

  openMassMailModal() {
    this.esEnvioIndividual = false;
    this.deudorDestino = null;
    this.asuntoCorreo = 'Recordatorio de Pago - Factor Fit';
    this.mensajeCorreo = `Estimados usuarios de Factor Fit Sede ${this.sede},\n\n` +
      `Les enviamos este recordatorio general para informarles que cuentan con un saldo pendiente en su mensualidad.\n\n` +
      `Favor de acudir a sucursal para evitar recargos adicionales. ¡Los esperamos!`;
    this.showMailModal.set(true);
  }

  confirmarEnvioCorreo() {
    if (this.cargando()) return;
    this.cargando.set(true);

    let destinatarios: string[] = [];

    // 1. Definir destinatarios
    if (this.esEnvioIndividual && this.deudorDestino) {
      destinatarios = [this.deudorDestino.email];
    } else {
      destinatarios = this.deudoresFiltrados()
        .map(u => u.email)
        .filter(e => !!e && e.includes('@'));
    }

    if (destinatarios.length === 0) {
      this.cargando.set(false);
      this.showToastMessage('No hay correos válidos para enviar', 'error');
      return;
    }

    // 2. CONFIGURAMOS EL PAYLOAD IDÉNTICO AL DE USERMANAGER
    const payload = {
      emails: destinatarios,
      asunto: this.asuntoCorreo,
      mensaje: this.mensajeCorreo,
      imagen: this.imagenSeleccionada, // Tu base64 capturado por onFileSelected
      sede: this.sede,                // Enviamos la sede para el footer
      tipo: 'promocion'               // Activamos tu diseño oscuro profesional de Node
    };

    // 3. Ejecutar envío
    this.usuarioService.enviarEmail(payload).subscribe({
      next: () => {
        this.showMailModal.set(false);
        this.cargando.set(false);
        this.imagenSeleccionada = null; // Limpiar imagen tras éxito
        this.showToastMessage(`¡Correo ${this.esEnvioIndividual ? 'individual' : 'masivo'} enviado con éxito!`);
      },
      error: (err) => {
        console.error('Error al enviar:', err);
        this.cargando.set(false);
        this.showToastMessage('Error al enviar el correo', 'error');
      }
    });
  }

  // --- UTILIDADES ---

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
}