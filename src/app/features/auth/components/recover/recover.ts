import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UsuarioService } from '../../../../core/services/usuario.service';

@Component({
    selector: 'app-recover',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './recover.html',
})
// ... otros imports
export class Recover {
    cargando = signal(false);
    mensajeError = signal('');
    
    // Nuevo signal para el Toast
    toast = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({
        visible: false,
        mensaje: '',
        tipo: 'success'
    });

    constructor(private usuarioService: UsuarioService, private router: Router) { }

    showToastMessage(mensaje: string, tipo: 'success' | 'error' = 'success') {
        this.toast.set({ visible: true, mensaje, tipo });
        
        // Si es éxito, esperamos un poco para que el usuario lea el mensaje antes de ir al login
        if (tipo === 'success') {
            setTimeout(() => {
                this.toast.set({ ...this.toast(), visible: false });
                this.router.navigate(['/auth/login']);
            }, 2500);
        } else {
            setTimeout(() => this.toast.set({ ...this.toast(), visible: false }), 3000);
        }
    }

onRecover(form: NgForm) {
    if (form.invalid) return;

    this.cargando.set(true);
    this.mensajeError.set('');

    // 1. Llamamos a Laravel para generar la nueva clave en la DB
    this.usuarioService.recuperarPassword(form.value.email).subscribe({
        next: (res) => {
            // Laravel debe retornar el nombre del usuario y la contraseña generada
            const datosParaCorreo = {
                emails: [form.value.email],
                asunto: 'Restablecer Contraseña - Factor Fit',
                mensaje: 'Se ha solicitado una recuperación de acceso para tu cuenta de Factor Fit.',
                nombres: res.nombres || 'Usuario', // Datos que vienen de tu API Laravel
                password: res.nuevaPassword,      // La contraseña temporal generada
                tipo: 'password'                  // Activa la plantilla morada
            };

            // 2. Enviamos el correo usando el nuevo servidor de Node
            this.usuarioService.enviarEmail(datosParaCorreo).subscribe({
                next: () => {
                    this.cargando.set(false);
                    this.showToastMessage('¡Éxito! Revisa tu correo para obtener tu nueva contraseña.');
                },
                error: () => {
                    this.cargando.set(false);
                    this.showToastMessage('Se cambió la clave, pero hubo un error al enviar el correo.', 'error');
                }
            });
        },
        error: (err) => {
            this.cargando.set(false);
            this.mensajeError.set(err.error.message || 'El correo no está registrado');
        }
    });
}
}