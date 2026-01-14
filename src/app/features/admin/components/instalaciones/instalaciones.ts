import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { InstalacionesService } from '../../../../core/services/instalaciones.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-instalaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './instalaciones.html',
  styleUrls: ['./instalaciones.css']
})
export class Instalaciones implements OnInit {

  /* ===============================
      DATA
  ================================ */
  instalacionesData: any[] = [];
  sede = localStorage.getItem('sede') ?? '';
  activeIndex = 0;
  clave!: string;
  modoEdicion = false;

  instalaciones: any = {
    titulo: '',
    descripcion: '',
    sede: this.sede,
    ruta_imagen: '' 
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;
  instalacionAEliminar: any = null;

  /* ===============================
      BUSCADOR
  ================================ */
  busqueda = '';
  resultados: any[] = [];

  /* ===============================
      TOAST
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

  constructor(
    private instalacionesService: InstalacionesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarListado();
    const param = this.route.snapshot.paramMap.get('clave_instalaciones');
    if (param && param !== 'nuevo') {
      this.clave = param;
      this.modoEdicion = true;
      this.cargarInstalacion();
    }
  }

  /* ===============================
      METODOS DE CARGA
  ================================ */
  cargarListado() {
    this.instalacionesService.getInstalaciones(this.sede).subscribe({
      next: data => {
        this.instalacionesData = Array.isArray(data) ? data.map(item => ({
          ...item,
          image: this.instalacionesService.getImagenInstalacion(item.ruta_imagen)
        })) : [];
        this.activeIndex = 0;
      },
      error: err => console.error(err)
    });
  }

  cargarInstalacion() {
    this.instalacionesService.getInstalacionesByClave(this.clave).subscribe({
      next: data => {
        this.instalaciones = {
          titulo: data.titulo,
          descripcion: data.descripcion,
          sede: data.sede,
          ruta_imagen: data.ruta_imagen
        };
        this.previewImage = this.instalacionesService.getImagenInstalacion(data.ruta_imagen);
      }
    });
  }

  /* ===============================
      GUARDAR (IGUAL QUE EVENTOS)
  ================================ */
  async guardar() {
    try {
      let urlImagenFinal = this.instalaciones.ruta_imagen;

      if (this.imagenFile) {
        // 1. Si editamos y hay imagen nueva, borramos la anterior de la nube
      if (this.modoEdicion && this.instalaciones.ruta_imagen?.includes('cloudinary')) {
          await this.instalacionesService.borrarImagenCloudy(this.instalaciones.ruta_imagen).toPromise();
      }

        // 2. Subimos la nueva imagen a Cloudinary
        const res = await this.instalacionesService.subirImagenCloudinary(this.imagenFile).toPromise();
        urlImagenFinal = res.secure_url;
      }

      // 3. Preparamos el JSON (No FormData)
      const datosParaGuardar = {
        titulo: this.instalaciones.titulo,
        descripcion: this.instalaciones.descripcion,
        sede: this.instalaciones.sede,
        ruta_imagen: urlImagenFinal
      };

      const peticion = this.modoEdicion
        ? this.instalacionesService.actualizarInstalaciones(this.clave, datosParaGuardar)
        : this.instalacionesService.registrarInstalaciones(datosParaGuardar);

      peticion.subscribe({
        next: () => {
          this.mostrarToast(this.modoEdicion ? 'Actualizado con éxito' : 'Registrado con éxito');
          this.cargarListado();
          this.limpiarFormulario();
        },
        error: (err) => this.mostrarError(err)
      });

    } catch (error) {
      console.error("Error en el proceso de imagen:", error);
      this.mostrarToast('Error al gestionar la imagen en la nube', 'error');
    }
  }


// Agrega esta propiedad al inicio de tu clase Events
instalacionesAEliminar: any = null;

// Modifica el método eliminar para que solo abra el modal
eliminar(ev: any) {
  this.instalacionesAEliminar = ev;
}

// Agrega el método que realmente ejecuta la acción al confirmar
async confirmarEliminacion() {
  if (!this.instalacionesAEliminar) return;
  
  const clave = this.instalacionesAEliminar.clave_instalaciones;
  const rutaImagen = this.instalacionesAEliminar.ruta_imagen;

  try {
    // 1. Intentar borrar de la nube
    if (rutaImagen && rutaImagen.includes('cloudinary')) {
      await this.instalacionesService.borrarImagenCloudy(rutaImagen).toPromise();
    }
  } catch (e) {
    console.warn("No se pudo borrar la imagen de la nube, procediendo con la BD", e);
  }

  // 2. Borrar de la base de datos
  this.instalacionesService.eliminarInstalaciones(clave).subscribe({
    next: () => {
      this.mostrarToast('Evento eliminado correctamente', 'success');
      this.cargarListado();
      this.instalacionesAEliminar = null; // Cerrar modal
    },
    error: (err) => {
      this.mostrarError(err);
      this.instalacionesAEliminar= null;
    }
  });
}






  
  /* ===============================
      FORMULARIO Y AUXILIARES
  ================================ */
  editar(item: any) {
    this.clave = item.clave_instalaciones;
    this.modoEdicion = true;
    this.instalaciones = { 
      titulo: item.titulo,
      descripcion: item.descripcion,
      sede: item.sede,
      ruta_imagen: item.ruta_imagen 
    };
    this.previewImage = this.instalacionesService.getImagenInstalacion(item.ruta_imagen);
    this.imagenFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewImage = reader.result as string);
    reader.readAsDataURL(file);
  }

  limpiarFormulario() {
    this.instalaciones = { titulo: '', descripcion: '', sede: this.sede, ruta_imagen: '' };
    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  mostrarError(err: any) {
    console.error(err);
    this.mostrarToast('Error inesperado en el servidor', 'error');
  }

  // Métodos del carrusel (se mantienen igual que los tenías)
  private circularIndex(index: number): number {
    const total = this.instalacionesData.length;
    return (index + total) % total;
  }
  scrollRight() { if (this.instalacionesData.length > 1) this.activeIndex = this.circularIndex(this.activeIndex + 1); }
  scrollLeft() { if (this.instalacionesData.length > 1) this.activeIndex = this.circularIndex(this.activeIndex - 1); }

  getMiniCardStyle(index: number) {
    const total = this.instalacionesData.length;
    let offset = index - this.activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    const isActive = offset === 0;
    const isMobile = window.innerWidth < 768;
    const xMove = isMobile ? offset * 110 : offset * 105;
    return {
      width: '100%',
      transform: `translateX(${xMove}%) scale(${isActive ? 1 : 0.85})`,
      opacity: isActive ? 1 : 0,
      visibility: isActive ? 'visible' : 'hidden',
      zIndex: 20 - Math.abs(offset),
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  }
}