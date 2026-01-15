import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-clients-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './clients-profile.html',
  styleUrls: ['./clients-profile.css']
})
export class ClientsProfile implements OnInit {
  // Configuración para el selector de teléfono
  extensiones = [
    '+52', '+1', '+44', '+33', '+49', '+34',
    '+55', '+54', '+81', '+82', '+86'
  ];
  telefonoExtension = '+52';

  // Datos del usuario
  user: any = null;
  clave_usuario!: string;
  passwordNueva: string = ''; 

  // Búsqueda (en caso de que el cliente pueda buscar otros o para consistencia de UI)
  busqueda: string = '';
  resultadosBusqueda: any[] = [];
  sede = localStorage.getItem('sede')?.split(',') || [];

  // Estado del Toast (Notificaciones)
  toast = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error'
  };

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

ngOnInit() {
    this.clave_usuario = this.route.parent?.snapshot.paramMap.get('clave_usuario') ?? 
                         this.route.snapshot.paramMap.get('clave_usuario') ?? '';
    
    if (this.clave_usuario) {
      this.cargarUsuario(this.clave_usuario);
    }
  }


cargarUsuario(clave_usuario: string) {
    this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
      next: (data) => {
        this.user = data;

        // Tratamiento de teléfono
        if (this.user.telefono) {
          const partes = this.user.telefono.split(" ");
          if (partes.length > 1) {
            this.telefonoExtension = partes[0]; 
            this.user.telefono = partes.slice(1).join(""); 
          }
        }

        // MOSTRAR IMAGEN DESDE CLOUDINARY
        this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
      },
      error: () => this.showToast("Error al cargar datos del perfil", "error")
    });
  }

  // MÉTODO ACTUALIZADO PARA SUBIR A CLOUDINARY DIRECTO
  subirFoto(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // 1. Subir directamente a Cloudinary desde Angular
    this.usuarioService.subirImagenCloudinaryDirecto(archivo).subscribe({
      next: (res: any) => {
        const urlCloudinary = res.secure_url;

        // 2. Enviar la URL a Laravel para actualizar el perfil
        // Usamos actualizarPerfil que ya tienes configurado
        this.usuarioService.actualizarPerfil(this.clave_usuario, { ruta_imagen: urlCloudinary })
          .subscribe({
            next: () => {
              this.user.ruta_imagen = urlCloudinary;
              this.user.ruta_imagen_mostrar = urlCloudinary;
              this.showToast("Foto de perfil actualizada", "success");
            },
            error: () => this.showToast("Error al guardar la nueva foto", "error")
          });
      },
      error: (err) => {
        console.error(err);
        this.showToast("Error al subir a la nube", "error");
      }
    });
  }

  guardarCambios() {
    if (!this.clave_usuario) return;
    const claveLimpia = this.clave_usuario.split(':')[0].trim();

    const datosAEnviar = { ...this.user };

    // Formatear Teléfono
    const numeroSolo = String(this.user.telefono || '').replace(/\D/g, '');
    datosAEnviar.telefono = `${this.telefonoExtension} ${numeroSolo}`;

    // Manejo de Contraseña
    if (this.passwordNueva && this.passwordNueva.trim() !== '') {
      datosAEnviar.password = this.passwordNueva;
    } else {
      delete datosAEnviar.password;
    }

    // Limpieza de campos de vista
    delete datosAEnviar.ruta_imagen_mostrar;

    this.usuarioService.actualizarPerfil(claveLimpia, datosAEnviar)
      .subscribe({
        next: () => {
          this.showToast("¡Perfil actualizado!", "success");
          this.passwordNueva = '';
          this.cargarUsuario(this.clave_usuario);
        },
        error: () => this.showToast("Error al guardar cambios", "error")
      });
  }



  // --- Utilidades ---

  showToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.mensaje = mensaje;
    this.toast.tipo = tipo;
    this.toast.visible = true;
    setTimeout(() => {
      this.toast.visible = false;
    }, 3000);
  }

  buscar() {
    const termino = this.busqueda.trim();
    if (termino.length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    this.usuarioService.buscarUsuariosDeSede(termino, this.user?.sede || this.sede[0])
      .subscribe({
        next: (data: any[]) => this.resultadosBusqueda = data,
        error: () => this.resultadosBusqueda = []
      });
  }
}