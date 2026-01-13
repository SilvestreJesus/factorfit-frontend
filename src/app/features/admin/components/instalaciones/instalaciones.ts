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

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }

  /* ===============================
     CONSTRUCTOR
  ================================ */
  constructor(
    private instalacionesService: InstalacionesService,
    private route: ActivatedRoute
  ) {}

  /* ===============================
     INIT
  ================================ */
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
     CARGAR DATA
  ================================ */
  cargarListado() {
    this.instalacionesService.getInstalaciones(this.sede).subscribe({
      next: data => {
        this.instalacionesData = Array.isArray(data) ? data : [];
        this.activeIndex = 0;
      },
      error: err => console.error(err)
    });
  }


  cargarInstalacion() {
    this.instalacionesService.getInstalaciones(this.sede).subscribe({
      next: (data) => {
        this.instalacionesData = Array.isArray(data)
          ? data.map(ev => ({
              ...ev,
              image: ev.ruta_imagen
                ? `${environment.apiUrl}/api/${ev.ruta_imagen}`
                : 'assets/no-image.png'
            }))
          : [];

        this.activeIndex = 0;
      },
      error: err => console.error(err)
    });
  }

  /* ===============================
     CARRUSEL
  ================================ */
  private circularIndex(index: number): number {
    const total = this.instalacionesData.length;
    return (index + total) % total;
  }

  scrollRight() {
    if (this.instalacionesData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex + 1);
  }

  scrollLeft() {
    if (this.instalacionesData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex - 1);
  }

  getMiniCardStyle(index: number) {
    const total = this.instalacionesData.length;
    let offset = index - this.activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const isActive = offset === 0;
    const isMobile = window.innerWidth < 768;

    // En móvil usamos un desplazamiento más corto
    const xMove = isMobile ? offset * 110 : offset * 105;

    return {
        width: '100%',
        transform: `
        translateX(${xMove}%) 
        scale(${isActive ? 1 : 0.85})
        `,
        opacity: isActive ? 1 : 0,
        visibility: isActive ? 'visible' : 'hidden',
        zIndex: 20 - Math.abs(offset),
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
    }
  /* ===============================
     EDITAR / ELIMINAR
  ================================ */


  editar(item: any) {
    this.clave = item.clave_instalaciones;
    this.modoEdicion = true;
    this.instalaciones = {
      titulo: item.titulo,
      descripcion: item.descripcion,
      sede: item.sede
    };
    this.previewImage = item.ruta_imagen ? `${this.apiUrl}/${item.ruta_imagen}` : null;
  }


  eliminar(clave: string) {
    this.instalacionesService.eliminarInstalaciones(clave).subscribe({
      next: () => {
        this.mostrarToast('Instalación eliminada correctamente', 'error');
        this.cargarListado();
        this.limpiarFormulario();
      },
      error: err => console.error(err)
    });
  }


  /* ===============================
     FORMULARIO
  ================================ */
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.imagenFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewImage = reader.result as string);
    reader.readAsDataURL(file);
  }

  guardar() {
    const formData = new FormData();
    formData.append('titulo', this.instalaciones.titulo);
    formData.append('descripcion', this.instalaciones.descripcion);
    formData.append('sede', this.instalaciones.sede);

    if (this.imagenFile) {
      formData.append('ruta_imagen', this.imagenFile);
    }

    const peticion = this.modoEdicion
      ? this.instalacionesService.actualizarInstalaciones(this.clave, formData)
      : this.instalacionesService.registrarInstalaciones(formData);

    peticion.subscribe({
      next: () => {
        this.mostrarToast(
          this.modoEdicion
            ? 'Instalación actualizada correctamente'
            : 'Instalación registrada correctamente',
          'success'
        );

        this.cargarListado();
        this.limpiarFormulario();
      },
      error: err => this.mostrarError(err)
    });
  }

  limpiarFormulario() {
    this.instalaciones = {
      titulo: '',
      descripcion: '',
      sede: this.sede
    };

    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  /* ===============================
     BUSCADOR
  ================================ */
  buscarInstalaciones() {
    const texto = this.busqueda.toLowerCase().trim();
    if (!texto) {
      this.resultados = [];
      return;
    }

    this.resultados = this.instalacionesData.filter(i =>
      i?.titulo?.toLowerCase().includes(texto) ||
      i?.descripcion?.toLowerCase().includes(texto)
    );
  }

  seleccionarInstalaciones(item: any) {
    this.busqueda = '';
    this.resultados = [];
    this.editar(item);
  }

  /* ===============================
     ERRORES
  ================================ */
  mostrarError(err: any) {
    console.error(err);
    this.mostrarToast('Error inesperado en el servidor', 'error');
  }
}
