import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <--- Importar esto

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule,RouterLink],
    templateUrl: './header.html',
    styleUrl: './header.css'
})
export class Header {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // Cerramos el menú al hacer click para que no tape la pantalla
      this.isMenuOpen = false;
    }
  }
}