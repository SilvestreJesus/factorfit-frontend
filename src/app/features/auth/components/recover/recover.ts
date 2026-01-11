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

        this.usuarioService.recuperarPassword(form.value.email).subscribe({
            next: (res) => {
                this.cargando.set(false);
                // Reemplazamos el alert por nuestro toast
                this.showToastMessage('¡Éxito! Revisa tu correo para obtener tu nueva contraseña.');
            },
            error: (err) => {
                this.cargando.set(false);
                // También podemos usar el toast para errores si prefieres
                this.mensajeError.set(err.error.message || 'Error al conectar con el servidor');
            }
        });
    }
}