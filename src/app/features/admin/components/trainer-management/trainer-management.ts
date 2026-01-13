import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TrainerService } from '../../../../core/services/trainer.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-trainer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trainer-management.html',
  styleUrls: ['./trainer-management.css']
})
export class TrainerManagement implements OnInit {
  personalData: any[] = [];
  sede = localStorage.getItem('sede') ?? '';
  apiUrl = environment.apiUrl;

  // Carrusel 3D
  activeIndex = 0;
  isMobile = false;

  clave!: string;
  modoEdicion = false;

  personal: any = {
    nombre_completo: '',
    puesto: '',
    descripcion: '',
    sede: this.sede,
    rol: 'personal'
  };

  imagenFile: File | null = null;
  previewImage: string | null = null;
  toast = { visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' };

  constructor(
    private trainerservice: TrainerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.checkScreen();
    this.cargarListado();
    const param = this.route.snapshot.paramMap.get('clave_personal');
    if (param && param !== 'nuevo') {
      this.clave = param;
      this.modoEdicion = true;
      this.cargarPersonal();
    }
  }

  @HostListener('window:resize')
  onResize() { this.checkScreen(); }

  checkScreen() {
    this.isMobile = window.innerWidth <= 768;
  }

  cargarListado() {
    this.trainerservice.getPersonal(this.sede).subscribe({
      next: (data) => {
        this.personalData = data;
        this.activeIndex = 0;
      },
      error: (err) => console.error(err)
    });
  }

  // Lógica de Navegación 3D
  scrollRight() {
    if (this.personalData.length <= 1) return;
    this.activeIndex = (this.activeIndex + 1) % this.personalData.length;
  }

  scrollLeft() {
    if (this.personalData.length <= 1) return;
    this.activeIndex = (this.activeIndex - 1 + this.personalData.length) % this.personalData.length;
  }

  get3DTransform(index: number): any {
    const total = this.personalData.length;
    let offset = index - this.activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);
    const isActive = offset === 0;

    // Usamos Math.round para evitar píxeles decimales que causan borrosidad
    let translateX = Math.round(offset * (this.isMobile ? 120 : 160));
    let translateZ = isActive ? 100 : -150;
    let rotateY = Math.round(offset * -35);
    let scale = isActive ? 1 : 0.8;

    return {
      'transform': `translateX(-50%) translateY(-50%) translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      'z-index': 100 - Math.round(absOffset),
      'opacity': absOffset > 1.5 ? 0 : (isActive ? 1 : 0.6),
      'backface-visibility': 'hidden'
      };
  }
  // --- CRUD ---
  cargarPersonal() {
    this.trainerservice.getPersonalByClave(this.clave).subscribe({
      next: (data) => {
        this.personal = { ...data };
        if (data.ruta_imagen) {
          this.previewImage = `${this.apiUrl}/api/${data.ruta_imagen}`;
        }
      }
    });
  }

  editar(item: any) {
    this.clave = item.clave_personal;
    this.modoEdicion = true;
    this.personal = { ...item };
    this.previewImage = item.ruta_imagen ? `${this.apiUrl}/${item.ruta_imagen}` : null;
  }

  eliminar(clave: string) {
    if (!confirm('¿Eliminar a este integrante del personal?')) return;
    this.trainerservice.eliminarPersonal(clave).subscribe({
      next: () => {
        this.mostrarToast('Personal eliminado', 'error');
        this.cargarListado();
        this.limpiarFormulario();
      }
    });
  }

  guardar() {
    const formData = new FormData();
    Object.keys(this.personal).forEach(key => formData.append(key, this.personal[key]));
    if (this.imagenFile) formData.append('ruta_imagen', this.imagenFile);

    const peticion = this.modoEdicion
      ? this.trainerservice.actualizarPersonal(this.clave, formData)
      : this.trainerservice.registrarPersonal(formData);

    peticion.subscribe({
      next: () => {
        this.mostrarToast(this.modoEdicion ? 'Actualizado correctamente' : 'Registrado correctamente');
        this.cargarListado();
        this.limpiarFormulario();
      },
      error: () => this.mostrarToast('Error al procesar solicitud', 'error')
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewImage = reader.result as string);
    reader.readAsDataURL(file);
  }

  limpiarFormulario() {
    this.personal = { nombre_completo: '', puesto: '', descripcion: '', sede: this.sede, rol: 'personal' };
    this.previewImage = null;
    this.imagenFile = null;
    this.modoEdicion = false;
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast = { visible: true, mensaje, tipo };
    setTimeout(() => (this.toast.visible = false), 3000);
  }
}