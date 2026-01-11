import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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
    private router: Router
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

  // ===== REGISTRO =====
  handleRegister(formValue: any) {

    //Contraseñas no coinciden
    if (formValue.password !== formValue.confirmPassword) {
      this.openModal(
        'error',
        'Contraseñas no coinciden',
        'Por favor verifica que ambas contraseñas sean iguales.'
      );
      return;
    }

    // Contraseña corta
    if (formValue.password.length < 6) {
      this.openModal(
        'error',
        'Contraseña inválida',
        'La contraseña debe tener mínimo 6 caracteres.'
      );
      return;
    }

    const telefonoCompleto = `${this.telefonoExtension} ${formValue.phone}`;

    const payload = {
      nombres          : formValue.firstName.toLowerCase().trim(),
      apellidos        : formValue.lastName.toLowerCase().trim(),
      fecha_nacimiento : formValue.birthDate,
      telefono         : telefonoCompleto,
      email            : formValue.email,
      password         : formValue.password,

      sede             : 'ninguno',
      status           : 'sin asignar',
      rol              : 'cliente',
      peso_inicial     : '0 kg',
      ruta_imagen      : null,
      qr_imagen        : null
    };

    this.http.post(`${environment.apiUrl}/api/usuarios`, payload).subscribe({
      next: () => {
        this.openModal(
          'success',
          'Registro exitoso',
          'Tu cuenta fue creada correctamente.\nEspera la activación de tu cuenta.'
        );
      },
      error: (error) => {

        let mensaje = 'Error inesperado, intenta nuevamente.';

        if (error.status === 422) {
          if (error.error?.errors?.email) {
            mensaje = 'El correo ya está registrado.';
          }
          if (error.error?.errors?.telefono) {
            mensaje = 'El teléfono no es válido.';
          }
        }

        this.openModal(
          'error',
          'Error en el registro',
          mensaje
        );
      }
    });
  }
}
