import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { EntrenamientosService } from '../../../../core/services/entrenamientos.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-entrenamientos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './entrenamientos.html',
  styleUrls: ['./entrenamientos.css']
})
export class Entrenamientos implements OnInit {

  /* ===============================
      DATA
  ================================ */
  entrenamientosData: any[] = [];
  sede = localStorage.getItem('sede') ?? '';

  activeIndex = 0;
  clave!: string;
  modoEdicion = false;

  entrenamientos: any = {
    titulo: '',
    descripcion: '',
    sede: this.sede,
    ruta_imagen: '' // Importante inicializarlo
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;
  entrenamientoAEliminar: any = null;

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

  constructor(
    private entrenamientosService: EntrenamientosService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarListado();
    const param = this.route.snapshot.paramMap.get('clave_entrenamientos');
    if (param && param !== 'nuevo') {
      this.clave = param;
      this.modoEdicion = true;
      this.cargarEntrenamiento();
    }
  }

  /* ===============================
      MÉTODOS DE CARGA
  ================================ */
  cargarListado() {
    this.entrenamientosService.getEntrenamientos(this.sede).subscribe({
      next: data => {
        this.entrenamientosData = Array.isArray(data) ? data.map(item => ({
          ...item,
          image: this.entrenamientosService.getImagenEntrenamientos(item.ruta_imagen)
        })) : [];
        this.activeIndex = 0;
      },
      error: err => console.error(err)
    });
  }

  cargarEntrenamiento() {
    this.entrenamientosService.getEntrenamientosByClave(this.clave).subscribe({
      next: data => {
        this.entrenamientos = {
          titulo: data.titulo,
          descripcion: data.descripcion,
          sede: data.sede,
          ruta_imagen: data.ruta_imagen
        };
        this.previewImage = this.entrenamientosService.getImagenEntrenamientos(data.ruta_imagen);
      }
    });
  }

  /* ===============================
      GUARDAR (Lógica Cloudinary)
  ================================ */
  async guardar() {
    try {
      let urlImagenFinal = this.entrenamientos.ruta_imagen;

      if (this.imagenFile) {
        // 1. Si editamos y hay imagen nueva, borramos la anterior de la nube
        if (this.modoEdicion && this.entrenamientos.ruta_imagen?.includes('cloudinary')) {
          try {
            await this.entrenamientosService.borrarImagenCloudy(this.entrenamientos.ruta_imagen).toPromise();
          } catch (e) {
            console.warn("No se pudo borrar la imagen vieja, continuando...", e);
          }
        }

        // 2. Subimos la nueva imagen a Cloudinary
        const res = await this.entrenamientosService.subirImagenCloudinary(this.imagenFile).toPromise();
        urlImagenFinal = res.secure_url;
      }

      // 3. Preparamos el JSON
      const datosParaGuardar = {
        titulo: this.entrenamientos.titulo,
        descripcion: this.entrenamientos.descripcion,
        sede: this.entrenamientos.sede,
        ruta_imagen: urlImagenFinal
      };

      const peticion = this.modoEdicion
        ? this.entrenamientosService.actualizarEntrenamientos(this.clave, datosParaGuardar)
        : this.entrenamientosService.registrarEntrenamientos(datosParaGuardar);

      peticion.subscribe({
        next: () => {
          this.mostrarToast(this.modoEdicion ? 'Actualizado' : 'Registrado');
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

  /* ===============================
      ELIMINAR
  ================================ */
  eliminar(item: any) {
    this.entrenamientoAEliminar = item;
  }

  async confirmarEliminacion() {
    if (!this.entrenamientoAEliminar) return;

    const clave = this.entrenamientoAEliminar.clave_entrenamientos;
    const rutaImagen = this.entrenamientoAEliminar.ruta_imagen;

    try {
      if (rutaImagen && rutaImagen.includes('cloudinary')) {
        await this.entrenamientosService.borrarImagenCloudy(rutaImagen).toPromise();
      }
    } catch (e) {
      console.warn("No se pudo borrar de la nube, procediendo con la BD", e);
    }

    this.entrenamientosService.eliminarEntrenamientos(clave).subscribe({
      next: () => {
        this.mostrarToast('Entrenamiento eliminado', 'success');
        this.cargarListado();
        this.entrenamientoAEliminar = null;
      },
      error: (err) => this.mostrarError(err)
    });
  }

  /* ===============================
      FORMULARIO Y AUXILIARES
  ================================ */
  editar(item: any) {
    this.clave = item.clave_entrenamientos;
    this.modoEdicion = true;
    this.entrenamientos = {
      titulo: item.titulo,
      descripcion: item.descripcion,
      sede: item.sede,
      ruta_imagen: item.ruta_imagen
    };
    this.previewImage = this.entrenamientosService.getImagenEntrenamientos(item.ruta_imagen);
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
    this.entrenamientos = { titulo: '', descripcion: '', sede: this.sede, ruta_imagen: '' };
    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }

  mostrarError(err: any) {
    console.error(err);
    this.mostrarToast('Error inesperado en el servidor', 'error');
  }

  // --- CARRUSEL ---
  private circularIndex(index: number): number {
    const total = this.entrenamientosData.length;
    return (index + total) % total;
  }
  scrollRight() { if (this.entrenamientosData.length > 1) this.activeIndex = this.circularIndex(this.activeIndex + 1); }
  scrollLeft() { if (this.entrenamientosData.length > 1) this.activeIndex = this.circularIndex(this.activeIndex - 1); }

  getMiniCardStyle(index: number) {
    const total = this.entrenamientosData.length;
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

  buscar() {
    const texto = this.busqueda.toLowerCase().trim();
    this.resultados = texto ? this.entrenamientosData.filter(i => 
      i.titulo.toLowerCase().includes(texto) || i.clave_entrenamientos.toLowerCase().includes(texto)
    ) : [];
  }

  seleccionar(item: any) {
    this.busqueda = '';
    this.resultados = [];
    this.editar(item);
  }
}