import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-client-header-default',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './client-header-default.html',
    styleUrl: './client-header-default.css',
})
export class ClientHeaderDefault implements OnInit {
    claveUsuario = '';
    isMenuOpen = signal(false);
    isHome = signal(false);

    constructor(private router: Router, private route: ActivatedRoute) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => this.checkRoute());
    }

    ngOnInit() {
        this.claveUsuario = this.route.snapshot.paramMap.get('clave_usuario') ?? '';
        this.checkRoute();
    }

    private checkRoute() {
        // Marcamos como home para que sea transparente
        this.isHome.set(this.router.url.includes('/home'));
    }

    toggleMenu() {
        this.isMenuOpen.set(!this.isMenuOpen());
    }

    logout() {
        localStorage.clear();
        this.router.navigate(['/auth/login']);
    }
}