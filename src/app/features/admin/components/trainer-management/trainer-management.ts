import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TrainerService } from '../../../../core/services/trainer.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-trainer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trainer-management.html',
  styleUrls: ['./trainer-management.css']
})
export class TrainerManagement implements OnInit {
  personalData: any[] = [];
  sede = localStorage.getItem('sede') ?? '';
  apiUrl = environment.apiUrl;

  // Carrusel 3D
  activeIndex = 0;
  isMobile = false;

  clave!: string;
  modoEdicion = false;

  personal: any = {
    nombre_completo: '',
    puesto: '',
    descripcion: '',
    sede: this.sede,
    rol: 'personal',
    ruta_imagen: '' // Guardaremos la URL de Cloudinary aquí
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;
  toast = { visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' };

  constructor(
    private trainerservice: TrainerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.checkScreen();
    this.cargarListado();
    const param = this.route.snapshot.paramMap.get('clave_personal');
    if (param && param !== 'nuevo') {
      this.clave = param;
      this.modoEdicion = true;
      this.cargarPersonal();
    }
  }

  @HostListener('window:resize')
  onResize() { this.checkScreen(); }

  checkScreen() {
    this.isMobile = window.innerWidth <= 768;
  }

  /* --- CARGA DE DATOS --- */
  cargarListado() {
    this.trainerservice.getPersonal(this.sede).subscribe({
      next: (data) => {
        this.personalData = Array.isArray(data) ? data.map(item => ({
          ...item,
          // Corregido el nombre del método según tu servicio (getImagenpersonal)
          image: this.trainerservice.getImagenPersonal(item.ruta_imagen)
        })) : [];
        this.activeIndex = 0;
      },
      error: (err) => console.error(err)
    });
  }

  cargarPersonal() {
    this.trainerservice.getPersonalByClave(this.clave).subscribe({
      next: (data) => {
        this.personal = { ...data };
        this.previewImage = this.trainerservice.getImagenPersonal(data.ruta_imagen);
      }
    });
  }

  /* --- LÓGICA DE GUARDADO (CLOUDINARY + JSON) --- */
  async guardar() {
    try {
      let urlImagenFinal = this.personal.ruta_imagen;

      // 1. Si hay una nueva imagen, primero la subimos a Cloudinary
      if (this.imagenFile) {
        // Si estamos editando y ya tenía una imagen en Cloudinary, podrías borrar la anterior aquí
        const resCloudy = await this.trainerservice.subirImagenCloudinary(this.imagenFile).toPromise();
        urlImagenFinal = resCloudy.secure_url;
      }

      // 2. Preparamos el objeto JSON para enviar al backend (Laravel)
      const payload = {
        ...this.personal,
        ruta_imagen: urlImagenFinal
      };

      // 3. Ejecutamos la petición (POST o PUT)
      const peticion = this.modoEdicion
        ? this.trainerservice.actualizarPersonal(this.clave, payload)
        : this.trainerservice.registrarPersonal(payload);

      peticion.subscribe({
        next: () => {
          this.mostrarToast(this.modoEdicion ? 'Actualizado correctamente' : 'Registrado correctamente');
          this.cargarListado();
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error(err);
          this.mostrarToast('Error al guardar en el servidor', 'error');
        }
      });

    } catch (error) {
      console.error('Error al subir imagen:', error);
      this.mostrarToast('Error al subir la imagen a la nube', 'error');
    }
  }


// Agrega esta propiedad al inicio de tu clase Events
personalAEliminar: any = null;

// Modifica el método eliminar para que solo abra el modal
eliminar(ev: any) {
  this.personalAEliminar = ev;
}

// Agrega el método que realmente ejecuta la acción al confirmar
async confirmarEliminacion() {
  if (!this.personalAEliminar) return;
  
  const clave = this.personalAEliminar.clave_personal;
  const rutaImagen = this.personalAEliminar.ruta_imagen;

  try {
    // 1. Intentar borrar de la nube
    if (rutaImagen && rutaImagen.includes('cloudinary')) {
      await this.trainerservice.borrarImagenCloudy(rutaImagen).toPromise();
    }
  } catch (e) {
    console.warn("No se pudo borrar la imagen de la nube, procediendo con la BD", e);
  }

  // 2. Borrar de la base de datos
  this.trainerservice.eliminarPersonal(clave).subscribe({
    next: () => {
      this.mostrarToast('personal eliminado correctamente', 'success');
      this.cargarListado();
      this.personalAEliminar = null; // Cerrar modal
    },
    error: (err) => {
      this.mostrarError(err);
      this.personalAEliminar = null;
    }
  });
}


  /* ===============================
     ERRORES
  ================================ */
  mostrarError(err: any) {
    this.mostrarToast('Error inesperado en el servidor', 'error');
    console.error(err);
  }




  /* --- MÉTODOS DE APOYO --- */
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewImage = reader.result as string);
    reader.readAsDataURL(file);
  }

  limpiarFormulario() {
    this.personal = { nombre_completo: '', puesto: '', descripcion: '', sede: this.sede, rol: 'personal', ruta_imagen: '' };
    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  editar(item: any) {
    this.clave = item.clave_personal;
    this.modoEdicion = true;
    this.personal = { ...item };
    this.previewImage = this.trainerservice.getImagenPersonal(item.ruta_imagen);
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }

  // Lógica de Navegación 3D
  scrollRight() {
    if (this.personalData.length <= 1) return;
    this.activeIndex = (this.activeIndex + 1) % this.personalData.length;
  }

  scrollLeft() {
    if (this.personalData.length <= 1) return;
    this.activeIndex = (this.activeIndex - 1 + this.personalData.length) % this.personalData.length;
  }

  get3DTransform(index: number): any {
    const total = this.personalData.length;
    let offset = index - this.activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);
    const isActive = offset === 0;

    // Usamos Math.round para evitar píxeles decimales que causan borrosidad
    let translateX = Math.round(offset * (this.isMobile ? 120 : 160));
    let translateZ = isActive ? 100 : -150;
    let rotateY = Math.round(offset * -35);
    let scale = isActive ? 1 : 0.8;

    return {
      'transform': `translateX(-50%) translateY(-50%) translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      'z-index': 100 - Math.round(absOffset),
      'opacity': absOffset > 1.5 ? 0 : (isActive ? 1 : 0.6),
      'backface-visibility': 'hidden'
      };
  }

}