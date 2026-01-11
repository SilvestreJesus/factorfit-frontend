import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Importa esto
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterModule, CommonModule], // Añádelos aquí
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {}