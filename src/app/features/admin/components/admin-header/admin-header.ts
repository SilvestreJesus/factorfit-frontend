import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css'], // <- corregido
})
export class AdminHeader implements OnInit {

  // Añadir al inicio de la clase
  isMenuOpen = false;

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Limpiar todos los datos del almacenamiento local y de sesión
      localStorage.clear();
      sessionStorage.clear();

      // 2. Opcional: Eliminar cookies si manejas alguna
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 3. Redirigir al login y recargar para asegurar limpieza de estados en memoria
      this.router.navigate(['/login']).then(() => {
          window.location.reload(); 
      });
    }
  }  
  rol = '';
  sede = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient // <- agregado
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.rol = localStorage.getItem('rol') ?? '';
      const sedeGuardada = localStorage.getItem('sede') ?? '';

      if (this.rol === 'superadmin') {
        let sedes = sedeGuardada.split(',').map(s => s.trim());
        if (sedes.length > 1) {
          this.sede = sedes[0];
          localStorage.setItem('sede', this.sede); 
        } else {
          this.sede = sedeGuardada;
        }
      } else {
        this.sede = sedeGuardada;
      }
    }
  }

  changeSede() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sede', this.sede);
      location.reload();
    }
  }



  irAPagos2() {
    if (isPlatformBrowser(this.platformId)) {
      // Llamada en segundo plano, no bloquea la navegación
      this.http.get('https://factorfit-backend-production.up.railway.app/api/pagos/actualizar').subscribe({
        next: () => console.log('Pagos actualizados en segundo plano'),
        error: (err) => console.error('Error actualizando pagos:', err)
      });

      // Navega inmediatamente
      this.router.navigate(['/admin/usuarios']);
    }  
  }

irAPagos() {
  if (isPlatformBrowser(this.platformId)) {
    // Agregamos la sede a la URL para que solo actualice lo necesario
    const url = `https://factorfit-backend-production.up.railway.app/api/pagos/actualizar?sede=${this.sede}`;
    
    this.http.get(url).subscribe({
      next: () => console.log(`Pagos de ${this.sede} actualizados`),
      error: (err) => console.error('Error:', err)
    });

    this.router.navigate(['/admin/pago']);
  }
}
  

}
