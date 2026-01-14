import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { environment } from '../../../../../environments/environment';

registerLocaleData(localeEs);

@Component({
  selector: 'app-user-pay',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-pay.html',
  styleUrls: ['./user-pay.css']
})
export class UserPay implements OnInit {
  // --- Estado ---
  usersData: any[] = [];
  filtroStatus = '';
  filtroTipoPago = 'todos';
  busqueda = '';
  sede = localStorage.getItem('sede') ?? '';
  
  // --- UI ---
  fechaHoraActual = signal(new Date());
  selectedUserForQr = signal<any | null>(null);

  // Inyectamos el servicio de usuarios y el cliente HTTP
  constructor(private usuarioService: UsuarioService, private http: HttpClient) {}

  ngOnInit() {    
    // Al entrar, sincronizamos con el servidor
    this.sincronizarYDescargar();

    // Reloj en tiempo real
    setInterval(() => {
      this.fechaHoraActual.set(new Date());
    }, 1000);
  }

  // Sincronización automática
  sincronizarYDescargar() {
    this.http.get(`${environment.apiUrl}/api/pagos/actualizar?sede=${this.sede}`).subscribe({
      next: () => {
        console.log('Sincronización exitosa para sede: ' + this.sede);
        this.cargarUsuarios(); 
      },
      error: (err) => {
        console.error('Error al sincronizar:', err);
        this.cargarUsuarios(); // Cargamos datos aunque falle la sincro
      }
    });
  }

  cargarUsuarios() {
    this.usuarioService.getUsuariosPorSede(this.sede).subscribe({
      next: (data) => {
        this.usersData = data.filter(u => 
          u.rol !== 'admin' && u.rol !== 'superadmin' && u.status !== 'eliminado'
        );
      },
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  // --- LÓGICA DE FILTRADO (Buscador + Botones) ---
  get usersFiltrados() {
    return this.usersData.filter(user => {
      if (user.status === 'eliminado' || user.status === 'sin asignar') return false;

      // Filtro por botones de Status
      const pasaStatus = !this.filtroStatus || 
        (this.filtroStatus === 'pendiente' 
          ? (user.status === 'pendiente' || user.status === 'proximo a vencer') 
          : user.status === this.filtroStatus);

      if (!pasaStatus) return false;

      // Filtro por buscador (Clave o Nombre)
      const texto = this.busqueda.toLowerCase();
      return (
        user.clave_usuario?.toString().toLowerCase().includes(texto) ||
        `${user.nombres} ${user.apellidos}`.toLowerCase().includes(texto) || user.telefono?.toLowerCase().includes(texto)
      );
    });
  }

  filtrar(status: string) {
    this.filtroStatus = status;
  }


cargarPagos() {
  let tipo: string | null = null;
  if (this.filtroTipoPago === 'Mensual') tipo = 'Mensual';
  else if (this.filtroTipoPago === 'Quincenal') tipo = 'Quincenal';

  this.usuarioService.getPagos(tipo || 'todos', this.sede).subscribe({
    next: (data) => {
      this.usersData = data.map((p, i) => {
        // ... (tu lógica de normalización de nombres)
        return {
          clave_usuario: p.clave_cliente,
          nombres: p.usuario?.nombres,
          apellidos: p.usuario?.apellidos,
          // IMPORTANTE: Usar el status que ya calculó el servidor
          status: p.usuario?.status, 
          tipo_pago: p.Tipo_pago
        };
      });
    }
  });
}


  showQrModal(user: any) {
    this.selectedUserForQr.set(user);
  }

  closeQrModal() {
    this.selectedUserForQr.set(null);
  }

  deleteUser(user: any) {
    const isConfirmed = confirm(`¿Estás seguro de que deseas marcar como eliminado a ${user.nombres}?`);
    if (!isConfirmed) return;

    this.usuarioService.eliminarUsuario(user.clave_usuario).subscribe({
      next: () => {
        alert(`${user.nombres} fue marcado como eliminado.`);
        this.usersData = this.usersData.filter(u => u.clave_usuario !== user.clave_usuario);
      },
      error: (err) => {
        console.error('Error al marcar como eliminado:', err);
        alert('Ocurrió un error al eliminar al usuario.');
      }
    });
  }



}
