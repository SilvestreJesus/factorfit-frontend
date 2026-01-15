import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { lastValueFrom } from 'rxjs'; // Para manejar promesas más fácil
import { UsuarioService } from '../../../../core/services/usuario.service'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  // ===== MODAL GLOBAL =====
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' = 'success';
  loading = false; // Bloquear botón mientras sube imágenes

  // ===== FECHA =====
  today: string = new Date().toISOString().split('T')[0];

  // ===== TELÉFONO =====
  extensiones = [
    '+52', '+1', '+44', '+33', '+49',
    '+34', '+55', '+54', '+81', '+82', '+86'
  ];

  telefonoExtension = '+52';

  constructor(
    private http: HttpClient,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  // ===== MODAL =====
  openModal(
    type: 'success' | 'error',
    title: string,
    message: string
  ) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;

    if (this.modalType === 'success') {
      this.router.navigate(['/auth/login']);
    }
  }


  async handleRegister(formValue: any) {
    if (this.loading) return;

    if (formValue.password !== formValue.confirmPassword) {
      this.openModal('error', 'Contraseñas no coinciden', 'Verifica que sean iguales.');
      return;
    }

    this.loading = true;

    try {
      // 1. GENERAR QR
      const qrData = `USUARIO:${formValue.email}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      // 2. CONVERTIR QR A ARCHIVO
      const qrResponse = await fetch(qrApiUrl);
      const blob = await qrResponse.blob();
      const qrFile = new File([blob], 'qr_autoregistro.png', { type: 'image/png' });

      // 3. SUBIR A CLOUDINARY USANDO TU SERVICIO
      // Usamos lastValueFrom para convertir el observable a promesa y esperar el resultado
      const cloudinaryRes = await lastValueFrom(this.usuarioService.subirImagenCloudinaryDirecto(qrFile));
      const urlQrCloudinary = cloudinaryRes.secure_url;

      // 4. PREPARAR PAYLOAD
      const payload = {
        nombres: formValue.firstName.toLowerCase().trim(),
        apellidos: formValue.lastName.toLowerCase().trim(),
        fecha_nacimiento: formValue.birthDate,
        telefono: `${this.telefonoExtension} ${formValue.phone}`,
        email: formValue.email,
        password: formValue.password,
        sede: 'ninguno',
        status: 'sin asignar',
        rol: 'cliente',
        peso_inicial: '0 kg',
        ruta_imagen: null,
        qr_imagen: urlQrCloudinary // URL obtenida de Cloudinary
      };

      // 5. ENVIAR A LARAVEL
      this.usuarioService.registrarUsuario(payload).subscribe({
        next: () => {
          this.openModal('success', 'Registro exitoso', 'Tu cuenta fue creada correctamente.');
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.openModal('error', 'Error en el registro', error.status === 422 ? 'El correo ya existe' : 'Error servidor');
        }
      });

    } catch (e) {
      console.error(e);
      this.loading = false;
      this.openModal('error', 'Error', 'No se pudo procesar el QR. Verifica el Upload Preset de Cloudinary.');
    }
  }

}
