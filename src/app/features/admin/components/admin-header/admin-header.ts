import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UsuarioService } from '../../../../core/services/usuario.service';

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

cambiosHoy = 0;




  rol = '';
  sede = '';
  isMenuOpen = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.rol = localStorage.getItem('rol') ?? '';
      this.sede = localStorage.getItem('sede') ?? '';

      // Si es superadmin, cargamos el contador inicialmente
      if (this.rol === 'superadmin' && this.sede) {
        this.obtenerCambiosBitacora();
      }
    }
  }


  obtenerCambiosBitacora() {
  if (!this.sede) return;

  // Usamos el endpoint que cuenta creaciones y actualizaciones de HOY
  this.usuarioService.getCambiosHoy(this.sede).subscribe({
    next: (res) => {
      // res.total viene del conteo de created_at o updated_at de hoy en tu PHP
      this.cambiosHoy = res.total; 
    },
    error: (err) => {
      console.error('Error en el contador de header:', err);
    }
  });
}
  // Al cambiar de sede, recargamos el contador antes de refrescar
  changeSede() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sede', this.sede);
      this.obtenerCambiosBitacora();
      location.reload(); 
    }
  }

  cargarContadorBitacora() {
    if (!this.sede) return;
    this.usuarioService.getCambiosHoy(this.sede).subscribe({
      next: (res) => this.cambiosHoy = res.total,
      error: (err) => console.error('Error cargando contador:', err)
    });
  }


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




  



  irAPagos2() {
    if (isPlatformBrowser(this.platformId)) {
      // Llamada en segundo plano, no bloquea la navegación
      this.http.get(`${environment.apiUrl}/api/pagos/actualizar`).subscribe({
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
      const url = `${environment.apiUrl}/api/pagos/actualizar?sede=${this.sede}`;
        
    this.http.get(url).subscribe({
      next: () => console.log(`Pagos de ${this.sede} actualizados`),
      error: (err) => console.error('Error:', err)
    });

    this.router.navigate(['/admin/pago']);
  }
}
  

}
