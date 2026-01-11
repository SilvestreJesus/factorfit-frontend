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

  user: any = null;
  pago: any = null; 
  clave_usuario!: string;

  busqueda: string = '';
  resultadosBusqueda: any[] = [];

  sede = localStorage.getItem('sede')?.split(',') || [];

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

passwordNueva: string = ''; 

guardarCambios() {
    if (!this.clave_usuario) return;

    // LIMPIEZA DE CLAVE: Esto quita el ":1" o cualquier cosa después de la clave real
    const claveLimpia = this.clave_usuario.split(':')[0].trim();

    const datosAEnviar = { ...this.user };

    // Limpiar ruta de imagen para la base de datos
    if (datosAEnviar.ruta_imagen && datosAEnviar.ruta_imagen.includes(environment.apiUrl)) {
        datosAEnviar.ruta_imagen = datosAEnviar.ruta_imagen.replace(`${environment.apiUrl}/`, '');
    }

    // Manejo de contraseña
    if (this.passwordNueva && this.passwordNueva.trim() !== '') {
        datosAEnviar.password = this.passwordNueva;
    } else {
        delete datosAEnviar.password;
    }

    // USAR CLAVE LIMPIA AQUÍ
    this.usuarioService.actualizarPerfil(claveLimpia, datosAEnviar)
      .subscribe({
        next: () => {
          this.showToast("¡Perfil actualizado con éxito!", "success");
          this.passwordNueva = ''; // Limpiar campo
        },
        error: (err) => {
          console.error("Error en la petición:", err);
          this.showToast("Error al guardar cambios", "error");
        }
      });
}


// El método subirFoto se queda igual, ya que ese actualiza solo la imagen
  subirFoto(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append('foto', archivo);

    this.usuarioService.subirFoto(this.clave_usuario, formData)
      .subscribe({
        next: (resp: any) => {
          // Actualizamos la vista con la nueva foto
          this.user.ruta_imagen = `${environment.apiUrl}/${resp.ruta_imagen}`;
          this.showToast("Foto de perfil actualizada", "success");
        },
        error: () => this.showToast("No se pudo subir la foto", "error")
      });
  }



  toast = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error'
  };


  showToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.mensaje = mensaje;
    this.toast.tipo = tipo;
    this.toast.visible = true;

    // Se oculta automáticamente tras 3 segundos
    setTimeout(() => {
      this.toast.visible = false;
    }, 3000);
  }


  ngOnInit() {
    this.clave_usuario = this.route.parent?.snapshot.paramMap.get('clave_usuario') ?? '';
    this.cargarUsuario(this.clave_usuario);

  }

  cargarUsuario(clave_usuario: string) {
    this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
        next: (data) => {
          this.user = data;

          if (this.user?.ruta_imagen) {
              this.user.ruta_imagen = `${environment.apiUrl}/${this.user.ruta_imagen}`;
          }
        }
    });

  }


  private actualizarUsuario() {
    this.usuarioService.actualizarUsuario(this.clave_usuario, this.user)
      .subscribe({
        next: () => this.showToast("¡Usuario actualizado con éxito!", "success"), // <--- Cambio aquí
        error: () => this.showToast("Error al actualizar usuario", "error")      // <--- Cambio aquí
      });
  }

  // ---------- BUSQUEDA -------------------
  buscar() {
    if (this.busqueda.trim().length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    this.usuarioService.buscarUsuariosDeSede(this.busqueda, this.user?.sede).subscribe({
      next: (data: any[]) => this.resultadosBusqueda = data
    });
  }


}