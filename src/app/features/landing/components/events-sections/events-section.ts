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
          clave_eventos: e.clave_eventos,
          titulo: e.titulo,
          descripcion: e.descripcion ?? '',
          sede: e.sede,
          imagen: e.ruta_imagen
            ? `${environment.apiUrl}/api/${e.ruta_imagen}`
            : 'assets/no-image.png'
        }));
      }
    });
  }

  /* 🎯 ESTILO DINÁMICO */
getCardStyle(index: number) {
  const total = this.eventos.length;
  let offset = index - this.activeIndex;

  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;

  const isActive = offset === 0;
  const isMobile = this.isBrowser ? window.innerWidth < 768 : false;

  const scale = isActive ? 1 : (isMobile ? 0.75 : 0.65);

  return {
    width: `${isActive ? (isMobile ? 300 : 900) : (isMobile ? 220 : 260)}px`,
    height: `${isActive ? (isMobile ? 380 : 520) : (isMobile ? 300 : 340)}px`,
    transform: `
      translateX(${offset * (isMobile ? 180 : 300)}px)
      rotateY(${offset * 8}deg)
      scale(${scale})
    `,
    opacity: isActive ? 1 : 0.35,
    zIndex: 10 - Math.abs(offset)
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
