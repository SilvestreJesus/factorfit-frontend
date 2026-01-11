import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home_clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home_clients.html',
  styleUrls: ['./home_clients.css']
})
export class HomeClients implements OnInit {

  user: any = null;
  pago: any = null; 
  clave_usuario!: string;

  busqueda: string = '';
  resultadosBusqueda: any[] = [];

  sede = localStorage.getItem('sede')?.split(',') || [];

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.clave_usuario = this.route.parent?.snapshot.paramMap.get('clave_usuario') ?? '';


    this.cargarUsuario(this.clave_usuario);
    this.cargarPago(this.clave_usuario);
  }

  cargarUsuario(clave_usuario: string) {
    this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
      next: (data) => {
        this.user = data;

        if (this.user?.qr_imagen) {
          this.user.qr_imagen = `${environment.apiUrl}/${this.user.qr_imagen}`;
        }

        this.user.sede = this.sede[0];
      }
    });
  }

  cargarPago(clave_usuario: string) {
    this.usuarioService.getPagosByClave(clave_usuario).subscribe({
      next: (data) => {
        this.pago = data || null;
      },
      error: () => {
        this.pago = null;
      }
    });
  }

apiUrl = environment.apiUrl;

  // Creamos un signal para el toast si no lo tienes definido (según tu HTML lo usas)
  toast = signal({ visible: false, mensaje: '', tipo: 'success' });

  // ... ngOnInit y cargarUsuario ...

  async downloadQR() {
    if (!this.user?.qr_imagen) return;

    // Obtenemos solo el nombre del archivo CLI00X.png
    const filename = this.user.qr_imagen.split('/').pop();
    const downloadUrl = `${this.apiUrl}/api/qr-download/${filename}`;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Error en la descarga');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${this.user.nombres}.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.mostrarToast('QR Descargado', 'success');
    } catch (error) {
      console.error(error);
      this.mostrarToast('No se pudo descargar el QR', 'error');
      // Intento de respaldo si falla el fetch
      window.open(downloadUrl, '_blank');
    }
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.set({ ...this.toast(), visible: false }), 3000);
  }

  getStatusClass(status: string): string {
  const s = status?.toLowerCase();
  switch (s) {
    case 'activo': return 'bg-emerald-500 shadow-emerald-500/50';
    case 'proximo a vencer': return 'bg-orange-500 shadow-orange-500/50';
    case 'pendiente': return 'bg-blue-500 shadow-blue-500/50';
    case 'inactivo':
    case 'vencido': return 'bg-red-600 shadow-red-600/50';
    default: return 'bg-gray-500';
  }
}

getTextStatusClass(status: string): string {
  const s = status?.toLowerCase();
  switch (s) {
    case 'activo': return 'text-emerald-400';
    case 'proximo a vencer': return 'text-orange-400';
    case 'pendiente': return 'text-blue-400';
    case 'inactivo':
    case 'vencido': return 'text-red-500';
    default: return 'text-white/50';
  } 
}

}
