import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css']
})
export class UserDetail implements OnInit {
  extensiones = [
    '+52', '+1', '+44', '+33', '+49', '+34',
    '+55', '+54', '+81', '+82', '+86'
  ];

  telefonoExtension = '+52';
  user: any = null;
  pago: any = null; 
  clave_usuario!: string;

  busqueda: string = '';
  resultadosBusqueda: any[] = [];

  sede = localStorage.getItem('sede')?.split(',') || [];


  toast = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error'
  };


  showToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.mensaje = mensaje;
    this.toast.tipo = tipo;
    this.toast.visible = true;

    // Se oculta automáticamente tras 3 segundos
    setTimeout(() => {
      this.toast.visible = false;
    }, 3000);
  }

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.clave_usuario = String(this.route.snapshot.paramMap.get('clave_usuario'));

    this.cargarUsuario(this.clave_usuario);
    this.cargarPago(this.clave_usuario);
  }




/* --- SUBIR FOTO --- */
subirFoto(event: any) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const formData = new FormData();
  formData.append('foto', archivo);

  this.usuarioService.subirFoto(this.clave_usuario, formData)
    .subscribe({
      next: (resp: any) => {
        // Al subir, el backend devuelve la URL de Cloudinary o el path local
        this.user.ruta_imagen = resp.ruta_imagen;
        
        // CORRECCIÓN: No concatenar manualmente, usar el helper
        this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(resp.ruta_imagen);
        
        this.showToast("Foto de perfil actualizada", "success");
      },
      error: () => this.showToast("Error al subir la foto", "error")
    });
}

  cargarUsuario(clave_usuario: string) {
    this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
      next: (data) => {
        this.user = data;

        // 1. FIJAR LA SEDE: Usamos la sede actual de la aplicación (la del localStorage)
        this.user.sede = this.sede[0];

        // 2. TRATAMIENTO DEL PESO: Quitar "0" y "Kg" para que el input esté limpio
        if (this.user.peso_inicial) {
          let pesoLimpio = this.user.peso_inicial
            .toString()
            .replace(/kg/i, '')
            .trim();
          
          // Si es "0", lo ponemos como null para que el input se vea vacío
          this.user.peso_inicial = (pesoLimpio === '0' || pesoLimpio === '') ? null : pesoLimpio;
        } else {
          this.user.peso_inicial = null;
        }

        // 3. TRATAMIENTO DEL TELÉFONO: Separar extensión de número
        if (this.user.telefono) {
          const partes = this.user.telefono.split(" ");
          if (partes.length > 1) {
            this.telefonoExtension = partes[0]; 
            this.user.telefono = partes.slice(1).join(""); 
          } else {
            this.user.telefono = this.user.telefono.replace(/\D/g, '');
          }
        }



      this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
      }
    });
  }

  guardarCambios() {
    const hoy = new Date();
    
    // Creamos una copia para el backend (payload) para NO ensuciar los inputs de la vista
    const payload = { ...this.user };

    // Formatear Peso para el Backend: Si está vacío mandamos "0 Kg"
    const valorPeso = this.user.peso_inicial;
    payload.peso_inicial = (valorPeso && valorPeso != 0) ? `${valorPeso} Kg` : '0 Kg';

    // Formatear Teléfono para el Backend: Unir extensión + número
    const numeroSolo = String(this.user.telefono || '').replace(/\D/g, '');
    payload.telefono = this.telefonoExtension ? `${this.telefonoExtension} ${numeroSolo}` : numeroSolo;

    // Asegurar que enviamos la sede correcta
    payload.sede = this.sede[0];

    if (this.user.status === 'sin asignar' || !this.pago) {
      payload.status = 'pendiente';
        // ... (Lógica de primer pago y asistencia se mantiene igual)
        this.usuarioService.registrarAsistencia({
            clave_cliente: this.clave_usuario,
            fecha_diario: this.formatLocalDate(hoy),
        }).subscribe({
            next: () => {
                const { fechaPago, tipo_pago } = this.calcularFechaPago(hoy);
                this.usuarioService.registrarPago({
                    clave_cliente: this.clave_usuario,
                    fecha_ingreso: this.formatLocalDate(hoy),
                    fecha_corte: this.formatLocalDate(fechaPago),
                    Tipo_pago: tipo_pago,
                    monto_pendiente: 500
                }).subscribe({
                  next: () => {
                    // Ahora actualizarUsuario lleva payload.status = 'pendiente'
                    this.actualizarUsuario(payload);
                    // También actualizamos la vista local para que el usuario vea el cambio
                    this.user.status = 'pendiente'; 
                  },
                    error: () => this.showToast("Error al generar pago inicial", "error")
                });
            }
        });
    } else {
        this.actualizarUsuario(payload);
    }
  }

  actualizarUsuario(datosAEnviar: any) {
    this.usuarioService.actualizarUsuario(this.clave_usuario, datosAEnviar)
      .subscribe({
        next: () => {
          this.showToast("Datos guardados correctamente", "success");
          // No es necesario recargar todo el usuario, para evitar que el input parpadee
        },
        error: () => this.showToast("Error al actualizar usuario", "error")
      });
  }







buscar() {
    const termino = this.busqueda.trim();
    if (termino.length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    // Enviamos el término tal cual; el backend debería usar LIKE case-insensitive.
    // Si tu backend es estrictamente sensible, podrías usar termino.toUpperCase()
    this.usuarioService.buscarUsuariosDeSede(termino, this.user?.sede || this.sede[0]).subscribe({
      next: (data: any[]) => {
        this.resultadosBusqueda = data;
      },
      error: () => { this.resultadosBusqueda = []; }
    });
  }

  seleccionarUsuario(usuario: any) {
    this.resultadosBusqueda = [];
    this.busqueda = '';
    this.clave_usuario = usuario.clave_usuario;

    this.cargarUsuario(this.clave_usuario);
    this.cargarPago(this.clave_usuario);
  }

  cargarPago(clave_usuario: string) {
      this.usuarioService.getPagosByClave(clave_usuario).subscribe({
          next: (data) => {
              this.pago = data || null;
          },
          error: (err) => {
              // Si es 404 simplemente lo ignoramos, es un usuario nuevo sin pago
              if (err.status === 404) {
                  this.pago = null;
              } else {
                  console.error("Error al cargar pago:", err);
              }
          }
      });
  }
  
  
// Sincronizamos la lógica de fechas con la de ClientRegistration para que sean iguales
private calcularFechaPago(fecha: Date): { fechaPago: Date, tipo_pago: string } {
    const day = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    
    let fechaPago: Date;
    let tipo_pago: string;

    if (day >= 1 && day <= 14) {
        fechaPago = new Date(anio, mes, 1);
        tipo_pago = 'Mensual';
    } 
    else if (day >= 15 && day <= 27) {
        fechaPago = new Date(anio, mes, 15);
        tipo_pago = 'Quincenal';
    } 
    else {
        fechaPago = new Date(anio, mes + 1, 1);
        tipo_pago = 'Mensual';
    }

    fechaPago.setHours(0, 0, 0, 0);
    return { fechaPago, tipo_pago };
}





  private formatLocalDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2,'0');
    const d = String(fecha.getDate()).padStart(2,'0');
    const h = String(fecha.getHours()).padStart(2,'0');
    const min = String(fecha.getMinutes()).padStart(2,'0');
    const s = String(fecha.getSeconds()).padStart(2,'0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }

 

  
}