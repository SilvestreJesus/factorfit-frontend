import { Component } from '@angular/core';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-registration.html',
  styleUrls: ['./client-registration.css']
})
export class ClientRegistration {

  extensiones = [
    '+52', '+1', '+44', '+33', '+49', '+34',
    '+55', '+54', '+81', '+82', '+86'
  ];
cargando = false; // Para deshabilitar el botón mientras procesa
  telefonoExtension = '+52';

  // Fecha de hoy solo YYYY-MM-DD para mostrar en el input
  today: string = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  sede = localStorage.getItem('sede') ?? '';

  usuario = {
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    fecha_inscripcion: this.today, // solo para mostrar en input
    fecha_corte: '',               // para backend (con hora)
    peso_inicial: ''
  };

  constructor(private usuarioService: UsuarioService) {
    const { fechaPago } = this.calcularFechaPago(new Date());
    this.usuario.fecha_corte = this.formatLocalDate(fechaPago);
  }

  /* ===============================
      LÓGICA DEL TOAST
  ================================ */
  toast = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error'
  };

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }
  // Para backend: YYYY-MM-DD HH:MM:SS
  private formatLocalDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2,'0');
    const d = String(fecha.getDate()).padStart(2,'0');
    const h = String(fecha.getHours()).padStart(2,'0');
    const min = String(fecha.getMinutes()).padStart(2,'0');
    const s = String(fecha.getSeconds()).padStart(2,'0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }


async registrarusuario() {
    if (this.cargando) return;
    this.cargando = true;

    const now = new Date();
    const { fechaPago, tipo_pago } = this.calcularFechaPago(now);
    
    try {
      // 1. GENERAR QR USANDO EL EMAIL (que es único)
      const qrData = `USUARIO:${this.usuario.email}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      // 2. CONVERTIR QR A ARCHIVO PARA CLOUDINARY
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const qrFile = new File([blob], 'qr_code.png', { type: 'image/png' });

      // 3. SUBIR QR A CLOUDINARY
      this.usuarioService.subirImagenCloudinaryDirecto(qrFile).subscribe({
        next: (cloudinaryRes) => {
          const urlQrCloudinary = cloudinaryRes.secure_url;

          // 4. PREPARAR PAYLOAD PARA LARAVEL
          let pesoFinal = this.usuario.peso_inicial?.trim() || '';
          if (pesoFinal !== '' && !pesoFinal.toLowerCase().includes('kg')) {
            pesoFinal = `${pesoFinal} Kg`;
          }

          const payload = {
            nombres: this.usuario.nombres,
            apellidos: this.usuario.apellidos,
            fecha_nacimiento: this.usuario.fecha_nacimiento,
            telefono: `${this.telefonoExtension} ${this.usuario.telefono}`,
            email: this.usuario.email,
            password: this.usuario.email, // Password inicial es su email
            fecha_inscripcion: this.formatLocalDate(now),
            fecha_corte: this.formatLocalDate(fechaPago),
            tipo_pago: tipo_pago,
            sede: this.sede,
            status: "pendiente",
            rol: "cliente",
            ruta_imagen: null,
            qr_imagen: urlQrCloudinary, // Enviamos la URL ya lista
            peso_inicial: pesoFinal
          };

          // 5. ENVIAR A LARAVEL
          this.ejecutarRegistroFinal(payload, tipo_pago);
        },
        error: () => {
          this.mostrarToast('Error al subir el QR a la nube', 'error');
          this.cargando = false;
        }
      });

    } catch (error) {
      this.mostrarToast('Error al procesar el registro', 'error');
      this.cargando = false;
    }
  }

  private ejecutarRegistroFinal(payload: any, tipo_pago: string) {
    this.usuarioService.registrarUsuario(payload).subscribe({
      next: (res) => {
        const clave = res.usuario.clave_usuario;
        const fechaInscripcionBackend = payload.fecha_inscripcion;
        const fechaCorteBackend = payload.fecha_corte;

        // Registro de Asistencia inicial
        this.usuarioService.registrarAsistencia({
          clave_cliente: clave,
          fecha_diario: fechaInscripcionBackend,
        }).subscribe({
          next: () => {
            // Registro de Pago inicial
            this.usuarioService.registrarPago({
              clave_cliente: clave,
              fecha_ingreso: fechaInscripcionBackend,
              fecha_corte: fechaCorteBackend,
              Tipo_pago: tipo_pago,
              monto_pendiente: 500
            }).subscribe({
              next: () => {
                this.mostrarToast('¡Usuario registrado correctamente!', 'success');
                this.limpiarFormulario();
                this.cargando = false;
              },
              error: () => this.finalizarConError('Error al registrar el pago')
            });
          },
          error: () => this.finalizarConError('Error al registrar asistencia')
        });
      },
      error: (err) => {
        if (err.status === 422) {
          this.mostrarToast('El correo ya está registrado', 'error');
        } else {
          this.mostrarToast('Error en el servidor Laravel', 'error');
        }
        this.cargando = false;
      }
    });
  }

  private finalizarConError(msg: string) {
    this.mostrarToast(msg, 'error');
    this.cargando = false;
  }

private calcularFechaPago(fecha: Date): { fechaPago: Date, tipo_pago: string } {
  const day = fecha.getDate();
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  
  let fechaPago: Date;
  let tipo_pago: string;

  if (day >= 1 && day <= 14) {
    fechaPago = new Date(anio, mes, 1);
    tipo_pago = 'Mensual';
  } 
  else if (day >= 15 && day <= 27) {
    fechaPago = new Date(anio, mes, 15);
    tipo_pago = 'Quincenal'; // <--- Regla del 15 al 27
  } 
  else {
    fechaPago = new Date(anio, mes + 1, 1);
    tipo_pago = 'Mensual'; // <--- Regla del 28 al 31
  }

  fechaPago.setHours(0, 0, 0, 0);
  return { fechaPago, tipo_pago };
}

  // Solo día para mostrar en el input de corte
  get fechaCorteDia(): string {
    if (!this.usuario.fecha_corte) return '';
    return this.usuario.fecha_corte.split(' ')[0].split('-')[2];
  }

  limpiarFormulario() {
    this.usuario = {
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      telefono: '',
      email: '',
      fecha_inscripcion: this.today,
      fecha_corte: this.usuario.fecha_corte,
      peso_inicial: '',
    };
  }
}