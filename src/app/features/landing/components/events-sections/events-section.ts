import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { EventosService } from '../../../../core/services/eventos.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-events-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-section.html',
  styleUrls: ['./events-section.css'],
})
export class EventsSection implements OnInit {

  eventos: any[] = [];
  activeIndex = 0;
  isBrowser = false;

  constructor(
    private eventosService: EventosService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }


  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
  this.eventosService.getEventos().subscribe({
    next: (data) => {
      this.eventos = data.map(e => ({
        ...e,
        // Lógica unificada para imágenes
        imagen: this.procesarImagenEvento(e.ruta_imagen)
      }));
    },
    error: (err) => console.error('Error al cargar eventos:', err)
  });
}

// Mantenemos la consistencia con Entrenamientos y Perfil
private procesarImagenEvento(ruta: string | null): string {
  if (!ruta) return 'assets/no-image.png';
  if (ruta.startsWith('http')) return ruta; // Cloudinary o URL externa
  return `${environment.apiUrl}/api/${ruta}`; // Servidor local
}

getCardStyle(index: number) {
  if (!this.eventos.length) return {};

  const total = this.eventos.length;
  let offset = index - this.activeIndex;

  // Lógica de loop para que el offset siempre sea el camino más corto
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;

  const isActive = offset === 0;
const isMobile = this.isBrowser ? window.innerWidth < 768 : false;
  
  // En PC (no mobile) hacemos la tarjeta mucho más ancha para el diseño horizontal
  const cardWidth = isActive ? (isMobile ? 320 : 900) : (isMobile ? 220 : 260);
  const scale = isActive ? 1 : (isMobile ? 0.8 : 0.7);

  return {
    width: `${cardWidth}px`,
    height: isActive ? 'auto' : (isMobile ? '350px' : '400px'),
    'min-height': isActive ? (isMobile ? '450px' : '500px') : 'auto',
    transform: `translateX(${offset * (isMobile ? 170 : 350)}px) scale(${scale})`,
    opacity: isActive ? 1 : 0.4,
    zIndex: 10 - Math.abs(offset),
    // Aseguramos que sea un contenedor flex para el cambio de dirección
    display: 'flex',
    'flex-direction': isMobile ? 'column' : 'row', 
    transition: 'all 0.5s ease'
  };
}





  /* ⬅➡ LOOP INFINITO CON FLECHAS */
  scrollRight() {
    if (!this.eventos.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.eventos.length;
  }

  scrollLeft() {
    if (!this.eventos.length) return;
    this.activeIndex =
      (this.activeIndex - 1 + this.eventos.length) % this.eventos.length;
  }
}
