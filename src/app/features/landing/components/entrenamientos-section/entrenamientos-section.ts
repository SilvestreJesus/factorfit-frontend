import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenamientosService } from '../../../../core/services/entrenamientos.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-entrenamientos-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrenamientos-section.html',
  styleUrls: ['./entrenamientos-section.css'],
})
export class EntrenamientosSection implements OnInit, AfterViewInit {

  entrenamientos: any[] = [];
  entrenamientosLoop: any[] = [];

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  cardWidth = 0;

  constructor(private entrenamientosService: EntrenamientosService) {}

  ngOnInit() {
    this.cargarEntrenamientos();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initPosition(), 0);
  }

cargarEntrenamientos() {
  this.entrenamientosService.getEntrenamientos().subscribe({
    next: (data) => {
      this.entrenamientos = data.map(e => ({
        clave_entrenamientos: e.clave_entrenamientos,
        titulo: e.titulo,
        descripcion: e.descripcion ?? '',
        sede: e.sede,
        // Usamos una lógica de procesamiento de imagen consistente
        imagen: this.procesarImagen(e.ruta_imagen)
      }));

      // Lógica de bucle infinito (Clones)
      if (this.entrenamientos.length > 0) {
        this.entrenamientosLoop = [
          this.entrenamientos[this.entrenamientos.length - 1],
          ...this.entrenamientos,
          this.entrenamientos[0]
        ];
      }

      setTimeout(() => this.initPosition(), 50); // Un pequeño delay para renderizado
    }
  });
}

// Función auxiliar para validar la procedencia de la imagen
procesarImagen(ruta: string | null): string {
  if (!ruta) return 'assets/no-image.png'; // Imagen por defecto local
  if (ruta.startsWith('http')) return ruta; // Ya es una URL completa (Cloudinary/S3)
  return `${environment.apiUrl}/api/${ruta}`; // Ruta local del backend
}

  initPosition() {
    const el = this.carousel.nativeElement;
    const firstCard = el.querySelector('.instalacion-card') as HTMLElement;

    if (!firstCard) return;

    this.cardWidth = firstCard.offsetWidth;
    el.scrollLeft = this.cardWidth; // empezamos en el primero REAL
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
    const max = this.cardWidth * (this.entrenamientos.length + 1);

    // clon final → saltamos al primero real (sin animación)
    if (el.scrollLeft >= max) {
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = this.cardWidth;
      el.style.scrollBehavior = 'smooth';
    }

    //  clon inicial → saltamos al último real
    if (el.scrollLeft <= 0) {
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = this.cardWidth * this.entrenamientos.length;
      el.style.scrollBehavior = 'smooth';
    }
  }
}
