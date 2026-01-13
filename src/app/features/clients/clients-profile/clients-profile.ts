import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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
    // Intentamos obtener la clave desde la ruta padre o la actual
    this.clave_usuario = this.route.parent?.snapshot.paramMap.get('clave_usuario') ?? 
                         this.route.snapshot.paramMap.get('clave_usuario') ?? '';
    
    if (this.clave_usuario) {
      this.cargarUsuario(this.clave_usuario);
    } else {
      this.showToast("No se encontró la clave de usuario", "error");
    }
  }



  cargarUsuario(clave_usuario: string) {
  this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
    next: (data) => {
      this.user = data;

      // 1. TRATAMIENTO DEL TELÉFONO
      if (this.user.telefono) {
        const partes = this.user.telefono.split(" ");
        if (partes.length > 1) {
          this.telefonoExtension = partes[0]; 
          this.user.telefono = partes.slice(1).join(""); 
        } else {
          this.user.telefono = this.user.telefono.replace(/\D/g, '');
        }
      }

      // 2. TRATAMIENTO DE IMAGEN (Consistente con los otros componentes)
      this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
    },
    error: () => this.showToast("Error al cargar datos del perfil", "error")
  });
}

subirFoto(event: any) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const formData = new FormData();
  formData.append('foto', archivo);

  this.usuarioService.subirFoto(this.clave_usuario, formData).subscribe({
    next: (resp: any) => {
      // Actualizamos la ruta interna y refrescamos la vista procesándola de nuevo
      this.user.ruta_imagen = resp.ruta_imagen;
      this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(resp.ruta_imagen);
      this.showToast("Foto de perfil actualizada", "success");
    },
    error: () => this.showToast("No se pudo subir la foto", "error")
  });
}

  guardarCambios() {
    if (!this.clave_usuario) return;

    // Limpiar la clave por si trae parámetros extra (ej. :1)
    const claveLimpia = this.clave_usuario.split(':')[0].trim();

    // Clonamos el objeto para no afectar la vista mientras se envía
    const datosAEnviar = { ...this.user };

    // 3. FORMATEAR TELÉFONO: Unir prefijo y número para la DB
    const numeroSolo = String(this.user.telefono || '').replace(/\D/g, '');
    datosAEnviar.telefono = this.telefonoExtension ? `${this.telefonoExtension} ${numeroSolo}` : numeroSolo;

    // 4. MANEJO DE CONTRASEÑA: Solo se envía si el usuario escribió algo
    if (this.passwordNueva && this.passwordNueva.trim() !== '') {
      datosAEnviar.password = this.passwordNueva;
    } else {
      delete datosAEnviar.password;
    }

    // 5. LIMPIEZA DE DATOS: Quitamos propiedades que solo son para la vista
    delete datosAEnviar.ruta_imagen_mostrar;

    this.usuarioService.actualizarPerfil(claveLimpia, datosAEnviar)
      .subscribe({
        next: () => {
          this.showToast("¡Perfil actualizado con éxito!", "success");
          this.passwordNueva = ''; // Resetear campo de password
          // Recargamos datos para confirmar que todo se guardó bien
          this.cargarUsuario(this.clave_usuario);
        },
        error: (err) => {
          console.error("Error al actualizar:", err);
          this.showToast("Error al guardar cambios", "error");
        }
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