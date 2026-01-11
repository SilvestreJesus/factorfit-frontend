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
          imagen: e.ruta_imagen
            ? `${environment.apiUrl}/${e.ruta_imagen}`
            : 'assets/no-image.png'
        }));

        // 🔁 CLONES (MISMA LÓGICA QUE INSTALACIONES)
        this.entrenamientosLoop = [
          this.entrenamientos[this.entrenamientos.length - 1],
          ...this.entrenamientos,
          this.entrenamientos[0]
        ];

        setTimeout(() => this.initPosition(), 0);
      }
    });
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
