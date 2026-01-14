import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { EventosService } from '../../../../core/services/eventos.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './events.html',
  styleUrls: ['./events.css']
})
export class Events implements OnInit {

  /* ===============================
     DATA
  ================================ */
  eventsData: any[] = [];
  sede = localStorage.getItem('sede') ?? '';

  activeIndex = 0;

  clave!: string;
  modoEdicion = false;

  eventos: any = {
    titulo: '',
    descripcion: '',
    sede: this.sede,
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;

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

  /* ===============================
     CONSTRUCTOR
  ================================ */
  constructor(
    private eventsService: EventosService,
    private route: ActivatedRoute
  ) {}

  /* ===============================
     INIT
  ================================ */
  ngOnInit() {
    this.cargarListado();

    const param = this.route.snapshot.paramMap.get('clave_eventos');
    if (param && param !== 'nuevo') {
      this.clave = param;
      this.modoEdicion = true;
      this.cargarEvento();
    }
  }

  /* ===============================
     TOAST
  ================================ */
  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }


cargarEvento() {
  this.eventsService.getEventosByClave(this.clave).subscribe({
    next: (data) => {
      this.eventos = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        sede: data.sede
      };

      // CAMBIO AQUÍ: Usar el servicio en lugar de concatenar manualmente
      this.previewImage = this.eventsService.getImagenEvento(data.ruta_imagen);
    }
  });
}

  /* ===============================
     CARRUSEL INFINITO REAL
  ================================ */

  private circularIndex(index: number): number {
    const total = this.eventsData.length;
    return (index + total) % total;
  }

  scrollRight() {
    if (this.eventsData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex + 1);
  }

  scrollLeft() {
    if (this.eventsData.length <= 1) return;
    this.activeIndex = this.circularIndex(this.activeIndex - 1);
  }

  getMiniCardStyle(index: number) {
      const total = this.eventsData.length;
      let offset = index - this.activeIndex;

      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const isActive = offset === 0;
      const isMobile = window.innerWidth < 768;
      
      // Ajustes de dimensiones
      const spacing = isMobile ? 130 : 260;
      const activeWidth = isMobile ? 240 : 360; // Un poco más angosto en móvil
      const inactiveWidth = isMobile ? 200 : 300;
      
      // IMPORTANTE: Altura suficiente en móvil
      const activeHeight = isMobile ? 320 : 340; 
      const inactiveHeight = isMobile ? 280 : 300;

      return {
          width: `${isActive ? activeWidth : inactiveWidth}px`,
          height: `${isActive ? activeHeight : inactiveHeight}px`,
          transform: `
              translateX(${offset * spacing}px)
              scale(${isActive ? 1 : 0.85})
          `,
          opacity: isActive ? 1 : 0.4,
          zIndex: 20 - Math.abs(offset),
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column'
      };
  }

  /* ===============================
     EDITAR / ELIMINAR
  ================================ */
cargarListado() {
  this.eventsService.getEventos(this.sede).subscribe({
    next: (data) => {
      this.eventsData = Array.isArray(data)
        ? data.map(ev => ({
            ...ev,
            // Usamos la lógica inteligente para la imagen
            image: this.eventsService.getImagenEvento(ev.ruta_imagen)
          }))
        : [];
      this.activeIndex = 0;
    },
    error: err => console.error(err)
  });
}

editar(ev: any) {
  this.clave = ev.clave_eventos;
  this.modoEdicion = true;
  this.eventos = {
    titulo: ev.titulo,
    descripcion: ev.descripcion,
    sede: ev.sede,
    ruta_imagen: ev.ruta_imagen // MANTENER LA URL AQUÍ
  };
  this.previewImage = this.eventsService.getImagenEvento(ev.ruta_imagen);
  this.imagenFile = null; // Resetear el archivo seleccionado
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

async guardar() {
  try {
    let urlImagenFinal = this.eventos.ruta_imagen;

    if (this.imagenFile) {
      // 1. Si hay una imagen vieja y el usuario subió una nueva, mandamos a borrar la vieja primero
      if (this.modoEdicion && this.eventos.ruta_imagen && this.eventos.ruta_imagen.includes('cloudinary')) {
        await this.eventsService.borrarImagenCloudy(this.eventos.ruta_imagen).toPromise();
      }

      // 2. Subimos la nueva imagen
      const res = await this.eventsService.subirImagenCloudinary(this.imagenFile).toPromise();
      urlImagenFinal = res.secure_url;
    }

    const datosParaGuardar = {
      titulo: this.eventos.titulo,
      descripcion: this.eventos.descripcion,
      sede: this.eventos.sede,
      ruta_imagen: urlImagenFinal
    };

    const peticion = this.modoEdicion
      ? this.eventsService.actualizarEventos(this.clave, datosParaGuardar)
      : this.eventsService.registrarEventos(datosParaGuardar);

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


// Agrega esta propiedad al inicio de tu clase Events
eventoAEliminar: any = null;

// Modifica el método eliminar para que solo abra el modal
eliminar(ev: any) {
  this.eventoAEliminar = ev;
}

// Agrega el método que realmente ejecuta la acción al confirmar
async confirmarEliminacion() {
  if (!this.eventoAEliminar) return;
  
  const clave = this.eventoAEliminar.clave_eventos;
  const rutaImagen = this.eventoAEliminar.ruta_imagen;

  try {
    // 1. Intentar borrar de la nube
    if (rutaImagen && rutaImagen.includes('cloudinary')) {
      await this.eventsService.borrarImagenCloudy(rutaImagen).toPromise();
    }
  } catch (e) {
    console.warn("No se pudo borrar la imagen de la nube, procediendo con la BD", e);
  }

  // 2. Borrar de la base de datos
  this.eventsService.eliminarEventos(clave).subscribe({
    next: () => {
      this.mostrarToast('Evento eliminado correctamente', 'success');
      this.cargarListado();
      this.eventoAEliminar = null; // Cerrar modal
    },
    error: (err) => {
      this.mostrarError(err);
      this.eventoAEliminar = null;
    }
  });
}





  limpiarFormulario() {
    this.eventos = {
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
  buscarEventos() {
    const texto = this.busqueda.toLowerCase().trim();
    if (!texto) {
      this.resultados = [];
      return;
    }

    this.resultados = this.eventsData.filter(ev =>
      ev?.clave_eventos?.toLowerCase().includes(texto) ||
      ev?.titulo?.toLowerCase().includes(texto) ||
      ev?.descripcion?.toLowerCase().includes(texto)
    );
  }

  seleccionarEvento(ev: any) {
    this.busqueda = '';
    this.resultados = [];
    this.editar(ev);
  }

  /* ===============================
     ERRORES
  ================================ */
  mostrarError(err: any) {
    this.mostrarToast('Error inesperado en el servidor', 'error');
    console.error(err);
  }
}
