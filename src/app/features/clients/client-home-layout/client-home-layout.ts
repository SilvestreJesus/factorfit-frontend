import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientHeaderDefault } from '../client-header-default/client-header-default'; // Asegúrate de que el nombre de la clase sea este

@Component({
    selector: 'app-client-home-layout',
    standalone: true,
    imports: [RouterOutlet, ClientHeaderDefault], // Importa la clase correcta
    templateUrl: './client-home-layout.html',
    styleUrl: './client-home-layout.css',
})
export class ClientHomeLayout { }