import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstalacionesService } from '../../../../core/services/instalaciones.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-instalaciones-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instalaciones-section.html',
  styleUrls: ['./instalaciones-section.css'],
})
export class InstalacionesSection implements OnInit, AfterViewInit {

  instalaciones: any[] = [];
  instalacionesLoop: any[] = [];

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  cardWidth = 0;

  constructor(private instalacionesService: InstalacionesService) {}

  ngOnInit() {
    this.cargarInstalaciones();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initPosition(), 0);
  }

cargarInstalaciones() {
  this.instalacionesService.getInstalaciones().subscribe({
    next: (data) => {
      this.instalaciones = data.map(e => {
        // Lógica de detección de imagen
        let rutaFinal = 'assets/no-image.png'; // Imagen por defecto

        if (e.ruta_imagen) {
          if (e.ruta_imagen.startsWith('http')) {
            // Si ya es una URL completa (Cloudinary), la usamos tal cual
            rutaFinal = e.ruta_imagen;
          } else {
            // Si es solo el nombre del archivo, le ponemos el prefijo del servidor local
            rutaFinal = `${environment.apiUrl}/api/${e.ruta_imagen}`;
          }
        }

        return {
          titulo: e.titulo,
          descripcion: e.descripcion ?? '',
          sede: e.sede,
          imagen: rutaFinal
        };
      });

      // CLONES para el loop infinito
      this.instalacionesLoop = [
        this.instalaciones[this.instalaciones.length - 1],
        ...this.instalaciones,
        this.instalaciones[0]
      ];

      setTimeout(() => this.initPosition(), 50);
    }
  });
}

  initPosition() {
    const el = this.carousel.nativeElement;
    const firstCard = el.querySelector('.instalacion-card') as HTMLElement;

    if (!firstCard) return;

    this.cardWidth = firstCard.offsetWidth;
    el.scrollLeft = this.cardWidth; // arrancamos en el primero real
  }

  scrollRight() {
    const el = this.carousel.nativeElement;
    el.scrollBy({ left: this.cardWidth, behavior: 'smooth' });

    setTimeout(() => this.fixPosition(), 350);
  }

  scrollLeft() {
    const el = this.carousel.nativeElement;
    el.scrollBy({ left: -this.cardWidth, behavior: 'smooth' });

    setTimeout(() => this.fixPosition(), 350);
  }

  fixPosition() {
    const el = this.carousel.nativeElement;
    const max = this.cardWidth * (this.instalaciones.length + 1);

    // si estamos en el clon final → saltamos al primero real
    if (el.scrollLeft >= max) {
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = this.cardWidth;
      el.style.scrollBehavior = 'smooth';
    }

    //  si estamos en el clon inicial → saltamos al último real
    if (el.scrollLeft <= 0) {
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = this.cardWidth * this.instalaciones.length;
      el.style.scrollBehavior = 'smooth';
    }
  }
}
