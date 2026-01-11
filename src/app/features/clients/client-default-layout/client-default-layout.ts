import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientHeaderDefault } from '../client-header-default/client-header-default';

@Component({
    selector: 'app-client-default-layout',
    standalone: true,
    imports: [RouterOutlet, ClientHeaderDefault],
    templateUrl: './client-default-layout.html',
    styleUrl: './client-default-layout.css',
})
export class ClientDefaultLayout {  }