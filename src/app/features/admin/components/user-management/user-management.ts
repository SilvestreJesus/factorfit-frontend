import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { QrCodeModal } from '../../../../shared/components/qr-code-modal/qr-code-modal';
import { HttpClient } from '@angular/common/http'; // <--- Agrega esta línea
import { environment } from '../../../../../environments/environment';

registerLocaleData(localeEs);

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, QrCodeModal],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagement implements OnInit {
  // Estado de Datos
  usersData = signal<any[]>([]);
  filtroStatus = signal<string>('');
  busqueda = signal<string>('');
  
  // Modals y UI
  selectedUserForQr = signal<any | null>(null);
  selectedUserForMail = signal<any | null>(null);
  fechaHoraActual = signal(new Date());

  // Formulario Correo
  asuntoCorreo = 'Información Importante ';
  mensajeCorreo = '';

  sede = localStorage.getItem('sede') ?? '';
  

  constructor(private usuarioService: UsuarioService, private http: HttpClient) {}

  toast = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({
    visible: false,
    mensaje: '',
    tipo: 'success'
  });


  userToDelete = signal<any | null>(null);

  showToastMessage(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.set({ ...this.toast(), visible: false }), 3000);
  }
  ngOnInit() {
    // En lugar de cargarUsuarios directo, sincronizamos primero
    this.sincronizarYDescargar();
    
    // El reloj sigue igual
    setInterval(() => this.fechaHoraActual.set(new Date()), 1000);
  }


// Nueva función para asegurar que la tabla siempre esté fresca
sincronizarYDescargar() {
  // Pasamos la sede como parámetro ?sede=NombreDeLaSede
  this.http.get(`${environment.apiUrl}/api/pagos/actualizar?sede=${this.sede}`).subscribe({
    next: () => {
      console.log(`Sincronización de la sede ${this.sede} completada`);
      // Una vez actualizado el servidor, descargamos los usuarios (que ya vienen filtrados por sede)
      this.cargarUsuarios();
    },
    error: (err) => {
      console.error('Error al sincronizar:', err);
      this.cargarUsuarios();
    }
  });
}

cargarUsuarios() {
  this.usuarioService.getUsuariosPorSede(this.sede).subscribe({
    next: (data) => {
      // Filtramos roles administrativos y eliminados
      const filtrados = data.filter(u => 
        u.rol !== 'admin' && 
        u.rol !== 'superadmin' && 
        u.status !== 'eliminado'
      );
      this.usersData.set(filtrados);
    },
    error: (err) => console.error('Error al cargar usuarios:', err)
  });
}  

usersFiltrados = computed(() => {
  // 1. Filtrar los que no están pendientes o próximos a vencer
  let filtrados = this.usersData().filter(user => 
    user.status !== 'pendiente' && user.status !== 'proximo a vencer'
  );

  // 2. Filtro por Tab (Status)
  const statusActual = this.filtroStatus();
  if (statusActual) {
    filtrados = filtrados.filter(user => {
      if (statusActual === 'sin asignar') {
        return !user.status || user.status === '' || user.status === 'ninguno' || user.status === 'sin asignar';
      }
      return user.status === statusActual;
    });
  }

  // 3. Filtro por Buscador (Texto)
  const texto = this.busqueda().toLowerCase();
  if (texto) {
    filtrados = filtrados.filter(user => 
      user.clave_usuario?.toString().toLowerCase().includes(texto) ||
      `${user.nombres} ${user.apellidos}`.toLowerCase().includes(texto) ||
      user.email?.toLowerCase().includes(texto) || user.telefono?.toLowerCase().includes(texto)
    );
  }

  // 4. ORDENAR POR ACTUALIZACIÓN (El más reciente arriba)
  // Usamos .slice() para no modificar la señal original
  return filtrados.slice().sort((a, b) => {
    const fechaA = new Date(a.updated_at || 0).getTime();
    const fechaB = new Date(b.updated_at || 0).getTime();
    return fechaB - fechaA; // De mayor (nuevo) a menor (viejo)
  });
});


  filtrar(status: string) {
    this.filtroStatus.set(status);
  }


// Agrega estos signals en tu clase
showWhatsAppModal = signal(false);
mensajeWhatsApp = '';

// Función para abrir el modal
openWhatsAppMassModal() {
  this.mensajeWhatsApp = `Hola, te contactamos de Factor Fit Sede ${this.sede}...`;
  this.showWhatsAppModal.set(true);
}

// Añade estos signals arriba con los demás
progresoEnvio = signal(0);
totalEnvio = signal(0);

async ejecutarEnvioMasivo() {
  const usuarios = this.usersFiltrados();
  this.totalEnvio.set(usuarios.length);
  this.progresoEnvio.set(0);
  this.cargando.set(true);
  // No cerramos el modal de inmediato para que el usuario vea el progreso
  // this.showWhatsAppModal.set(false); 

  for (const user of usuarios) {
    const tel = user.telefono.replace(/\D/g, '');
    const numeroFinal = tel.length === 10 ? '521' + tel : tel;

    const payload = {
      numero: numeroFinal,
      mensaje: this.mensajeWhatsApp.replace('{nombre}', user.nombres)
    };

    try {
      await this.http.post('https://bot-factorfit-production.up.railway.app/enviar', payload).toPromise();
      
      this.progresoEnvio.update(v => v + 1);
      console.log(`Mensaje enviado a ${user.nombres}`);
    } catch (e) {
      console.error(`Error con ${user.nombres}`, e);
    }
    
    // Espera de seguridad
    await new Promise(res => setTimeout(res, 2000));
  }

  this.cargando.set(false);
  this.showWhatsAppModal.set(false); // Ahora sí cerramos
  this.showToastMessage('¡Envío masivo terminado con éxito!');
}
  // --- MÉTODOS DE ACCIÓN ---

// Cambia el nombre a getWhatsAppUrl para que coincida con lo que pusimos en el HTML
getWhatsAppUrl(user: any): string {
  if (!user || !user.telefono) return '#';

  // 1. Limpiamos el número: quitamos '+', espacios y guiones
  // Esto convierte "+52 481 381 2044" en "524813812044"
  const telefonoLimpio = user.telefono.replace(/\D/g, '');

  // 2. Creamos el mensaje
  const mensaje = `Hola *${user.nombres} ${user.apellidos}*, te contactamos de *Factor Fit Sede ${this.sede}* para darte seguimiento.`;

  // 3. Retornamos la URL de WhatsApp
  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}


  closeMailModal() {
    this.selectedUserForMail.set(null);
    this.mensajeCorreo = '';
  }

  // Nuevas variables de estado
  imagenSeleccionada: string | null = null;
  showToast = false;

  // Método para capturar la imagen
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenSeleccionada = e.target.result; // Esto es el Base64
      };
      reader.readAsDataURL(file);
    }
  }

isMassEmail = signal<boolean>(false);
  cargando = signal<boolean>(false); // Para el estado de "Enviando..."
  
  // Abrir modal para un solo usuario
  openMailModal(user: any) {
    this.isMassEmail.set(false);
    this.selectedUserForMail.set(user);
    this.mensajeCorreo = `Estimado/a ${user.nombres} ${user.apellidos},\n\nEscribimos para comunicarle que...`;
  }

  // Abrir modal para envío masivo (usa el filtro actual)
  openMassMailModal() {
    this.isMassEmail.set(true);
    // Creamos un "usuario ficticio" para que el modal se muestre
    this.selectedUserForMail.set({ email: 'Varios destinatarios' });
    this.mensajeCorreo = `Estimados usuarios de Factor Fit,\n\nNos comunicamos con ustedes para...`;
  }

enviarCorreo() {
  if (!this.selectedUserForMail()) return;
  this.cargando.set(true);

  const destinatarios = this.isMassEmail() 
    ? this.usersFiltrados().map(u => u.email).filter(e => !!e)
    : [this.selectedUserForMail()?.email];

  // CONFIGURAMOS EL PAYLOAD CON TUS NUEVOS ESTILOS
  const payload = {
    emails: destinatarios,
    asunto: this.asuntoCorreo,
    mensaje: this.mensajeCorreo,
    imagen: this.imagenSeleccionada, // Tu base64
    sede: this.sede,                // Enviamos la sede para el footer
    tipo: 'promocion'               // Activamos tu diseño oscuro profesional
  };

  // Usamos el servicio (en lugar de this.http directamente para mantener orden)
  this.usuarioService.enviarEmail2(payload).subscribe({
    next: () => {
      this.closeMailModal();
      this.imagenSeleccionada = null;
      this.cargando.set(false);
      this.showToastMessage('¡Correo enviado con éxito!');
    },
    error: (err) => {
      console.error(err);
      this.cargando.set(false);
      this.showToastMessage('Error al enviar el correo', 'error');
    }
  });
}

  showQrModal(user: any) { this.selectedUserForQr.set(user); }
  closeQrModal() { this.selectedUserForQr.set(null); }

  deleteUser(user: any) {
    // En lugar de confirm(), abrimos el modal estilizado
    this.userToDelete.set(user);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.usuarioService.eliminarUsuario(user.clave_usuario).subscribe({
      next: () => {
        this.showToastMessage(`Usuario ${user.nombres} eliminado.`);
        this.usersData.set(this.usersData().filter(u => u.clave_usuario !== user.clave_usuario));
        this.userToDelete.set(null); // Cerrar modal
      },
      error: () => {
        this.showToastMessage('Error al eliminar usuario', 'error');
        this.userToDelete.set(null);
      }
    });
  }

}