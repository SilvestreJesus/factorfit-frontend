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
    sede: this.sede
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;
  apiUrl = environment.apiUrl;

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
      // PROCESAMOS LAS IMÁGENES AL CARGAR EL LISTADO
      this.entrenamientosData = Array.isArray(data) ? data.map(item => ({
        ...item,
        // Usamos el helper del servicio para que decida si es URL local o Cloudinary
        image: this.entrenamientosService.getImagenEntrenamiento(item.ruta_imagen)
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
        sede: data.sede
      };
      // CORRECCIÓN: Usar el servicio
      this.previewImage = this.entrenamientosService.getImagenEntrenamiento(data.ruta_imagen);
    }
  });
}

editar(item: any) {
  this.clave = item.clave_entrenamientos;
  this.modoEdicion = true;
  this.entrenamientos = {
    titulo: item.titulo,
    descripcion: item.descripcion,
    sede: item.sede
  };
  // CORRECCIÓN: Usar el servicio
  this.previewImage = this.entrenamientosService.getImagenEntrenamiento(item.ruta_imagen);
}
  /* ===============================
      LÓGICA CARRUSEL
  ================================ */
  private circularIndex(index: number): number {
    const total = this.entrenamientosData.length;
    return (index + total) % total;
  }

  scrollRight() {
    if (this.entrenamientosData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex + 1);
  }

  scrollLeft() {
    if (this.entrenamientosData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex - 1);
  }

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

 
  eliminar(clave: string) {
    this.entrenamientosService.eliminarEntrenamientos(clave).subscribe({
      next: () => {
        this.mostrarToast('Entrenamiento eliminado correctamente', 'error');
        this.cargarListado();
        this.limpiarFormulario();
      },
      error: err => console.error(err)
    });
  }


  guardar() {
    const formData = new FormData();
    formData.append('titulo', this.entrenamientos.titulo);
    formData.append('descripcion', this.entrenamientos.descripcion);
    formData.append('sede', this.entrenamientos.sede);
    if (this.imagenFile) formData.append('ruta_imagen', this.imagenFile);

    const peticion = this.modoEdicion
      ? this.entrenamientosService.actualizarEntrenamientos(this.clave, formData)
      : this.entrenamientosService.registrarEntrenamientos(formData);

    peticion.subscribe({
      next: () => {
        this.mostrarToast(this.modoEdicion ? 'Actualizado correctamente' : 'Registrado correctamente');
        this.cargarListado();
        this.limpiarFormulario();
      },
      error: err => this.mostrarToast('Error al procesar la solicitud', 'error')
    });
  }

  /* ===============================
      BUSCADOR Y UTILS
  ================================ */
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

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.previewImage = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  limpiarFormulario() {
    this.entrenamientos = { titulo: '', descripcion: '', sede: this.sede };
    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }
}