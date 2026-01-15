import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { BehaviorSubject } from 'rxjs';

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
    
    // 1. Obtener lo que hay en storage
    let sedeGuardada = localStorage.getItem('sede');
    
    // 2. Lógica de corrección para Superadmin
    if (this.rol === 'superadmin') {
      // Si la sede guardada contiene una coma o es inválida para el select, forzamos 'Emiliano'
      if (!sedeGuardada || sedeGuardada.includes(',') || sedeGuardada === 'ninguno' || sedeGuardada === '') {
        sedeGuardada = 'Emiliano';
        localStorage.setItem('sede', 'Emiliano'); 
      }
    }

    // 3. Asignar a la variable (Ahora sí coincidirá con el <option value="Emiliano">)
    this.sede = sedeGuardada ?? '';

    this.usuarioService.notificaciónLimpiada$.subscribe(limpio => {
      if (limpio) this.obtenerCambiosBitacora();
    });

    if (this.rol === 'superadmin' && this.sede) {
      this.obtenerCambiosBitacora();
    }
  }
}

obtenerCambiosBitacora() {
  if (!this.sede) return;

  // Sumamos lo que el usuario ya marcó como visto en las 3 pestañas
  const vistoPagos = Number(localStorage.getItem('visto_pagos') ?? 0);
  const vistoAsistencias = Number(localStorage.getItem('visto_asistencias') ?? 0);
  const vistoRenovacion = Number(localStorage.getItem('visto_renovacion') ?? 0);
  
  const totalVistos = vistoPagos + vistoAsistencias + vistoRenovacion;

  // Enviamos ese número al backend
  this.usuarioService.getCambiosHoy(this.sede, totalVistos).subscribe({
    next: (res) => {
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
