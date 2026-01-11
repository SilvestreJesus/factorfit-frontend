import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-clients-header',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './clients-header.html',
    styleUrl: './clients-header.css',
})
export class ClientsHeader {

    claveUsuario = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute 
    ) {}

    ngOnInit() {
        // Leer el parámetro del padre (ClientsLayout)
        this.claveUsuario = this.route.snapshot.paramMap.get('clave_usuario') ?? '';
    }

    logout() {
        // Limpiar datos si quieres
        localStorage.clear();
        this.router.navigate(['/auth/login']);
    }
}
