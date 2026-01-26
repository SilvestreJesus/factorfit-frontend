import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { UsuarioService } from '../../../../core/services/usuario.service';

@Component({
  selector: 'app-registeremiliano',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './registeremiliano.html',
  styleUrls: ['./registeremiliano.css']
})
export class RegisterObrera {
  // ===== MODAL / UI =====
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' = 'success';
  loading = false;

  // ===== DATOS Y FECHAS =====
  today: string = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  extensiones = ['+52', '+1', '+44', '+33', '+49', '+34', '+55', '+54', '+81', '+82', '+86'];
  telefonoExtension = '+52';
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  private formatLocalDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    const h = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const s = String(fecha.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
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
    } else if (day >= 15 && day <= 27) {
      fechaPago = new Date(anio, mes, 15);
      tipo_pago = 'Quincenal';
    } else {
      fechaPago = new Date(anio, mes + 1, 1);
      tipo_pago = 'Mensual';
    }
    fechaPago.setHours(0, 0, 0, 0);
    return { fechaPago, tipo_pago };
  }

  async handleRegister(formValue: any) {
    if (this.loading) return;

    // --- VALIDACIONES DE CONTRASEÑA ---
    if (formValue.password.length < 6) {
      this.openModal('error', 'Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formValue.password !== formValue.confirmPassword) {
      this.openModal('error', 'Error de coincidencia', 'Las contraseñas no coinciden.');
      return;
    }

    this.loading = true;
    const now = new Date();
    const { fechaPago, tipo_pago } = this.calcularFechaPago(now);

    try {
      // 1. Imagen Perfil
      let rutaImagenCloudinary = null;
      if (this.selectedFile) {
        const uploadRes = await lastValueFrom(this.usuarioService.subirImagenCloudinaryDirecto(this.selectedFile));
        rutaImagenCloudinary = uploadRes.secure_url;
      }

      // 2. Peso
      let pesoFinal = formValue.peso_inicial?.toString().trim() || '';
      if (pesoFinal !== '' && !pesoFinal.toLowerCase().includes('kg')) {
        pesoFinal = `${pesoFinal} Kg`;
      }

      // 3. Payload
      const payload = {
        nombres: formValue.firstName.toLowerCase().trim(),
        apellidos: formValue.lastName.toLowerCase().trim(),
        fecha_nacimiento: formValue.birthDate,
        telefono: `${this.telefonoExtension} ${formValue.phone}`,
        email: formValue.email,
        password: formValue.password,
        fecha_inscripcion: this.formatLocalDate(now),
        fecha_corte: this.formatLocalDate(fechaPago),
        tipo_pago: tipo_pago,
        sede: 'Obrera',
        status: 'pendiente',
        rol: 'cliente',
        ruta_imagen: rutaImagenCloudinary,
        peso_inicial: pesoFinal
      };

      // 4. Registro Usuario
      this.usuarioService.registrarUsuario(payload).subscribe({
        next: async (res) => {
          const claveOficial = res.usuario.clave_usuario;
          
          try {
            // 5. QR
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${claveOficial}`;
            const qrResp = await fetch(qrApiUrl);
            const blob = await qrResp.blob();
            const qrFile = new File([blob], 'qr.png', { type: 'image/png' });

            const clQR = await lastValueFrom(this.usuarioService.subirImagenCloudinaryDirecto(qrFile));
            await lastValueFrom(this.usuarioService.update(claveOficial, { qr_imagen: clQR.secure_url }));

            // 6. Asistencia y Pago ($500)
            this.ejecutarProcesosFinales(claveOficial, payload, tipo_pago);

          } catch (err) {
            this.finalizarConError('Usuario creado, pero hubo un error con el QR');
          }
        },
        error: (err) => {
          const msg = err.status === 422 ? 'El correo ya está registrado' : 'Error al registrar usuario';
          this.openModal('error', 'Error', msg);
          this.loading = false;
        }
      });

    } catch (e) {
      this.finalizarConError('Error en el proceso de registro');
    }
  }

  private ejecutarProcesosFinales(clave: string, payload: any, tipo_pago: string) {
    this.usuarioService.registrarAsistencia({
      clave_cliente: clave,
      fecha_diario: payload.fecha_inscripcion,
    }).subscribe({
      next: () => {
        this.usuarioService.registrarPago({
          clave_cliente: clave,
          fecha_ingreso: payload.fecha_inscripcion,
          fecha_corte: payload.fecha_corte,
          Tipo_pago: tipo_pago,
          monto_pendiente: 500
        }).subscribe({
          next: () => {
            this.loading = false;
            this.openModal('success', '¡Bienvenido!', `Registro completo. Tu clave es: ${clave}`);
          },
          error: () => this.finalizarConError('Error en registro de pago inicial')
        });
      },
      error: () => this.finalizarConError('Error en registro de asistencia inicial')
    });
  }

  private finalizarConError(msg: string) {
    this.openModal('error', 'Error', msg);
    this.loading = false;
  }

  openModal(type: 'success' | 'error', title: string, message: string) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  get fechaCorteDia(): string {
    const { fechaPago } = this.calcularFechaPago(new Date());
    // Retorna solo el día (ej: "01" o "15")
    return String(fechaPago.getDate()).padStart(2, '0');
  }

  closeModal() {
    this.showModal = false;
    if (this.modalType === 'success') {
      this.router.navigate(['/auth/login']);
    }
  }
}