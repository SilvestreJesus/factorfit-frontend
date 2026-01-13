import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para usar ngIf o el nuevo flujo de control

@Component({
  selector: 'app-location-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-section.html',
  styleUrl: './location-section.css'
})
export class LocationSection {
  // 1 = Sede Zapata, 2 = Sede Central
  sedeActual: number = 1;

cambiarSede(numero: number) {
  this.sedeActual = numero;
  // Opcional: imprimir en consola para verificar que el clic funciona
  console.log('Cambiando a sede:', numero);
}
}