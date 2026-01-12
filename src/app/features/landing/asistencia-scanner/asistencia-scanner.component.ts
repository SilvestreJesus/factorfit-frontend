import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library'; // Importante para corregir el error TS2322
import { AsistenciaService } from '../../../core/services/asistencia.service';

@Component({
  selector: 'app-asistencia-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './asistencia-scanner.component.html',
  styleUrls: ['./asistencia-scanner.component.css']
})
export class AsistenciaScannerComponent {
  scannerEnabled = true;
  allowedFormats = [BarcodeFormat.QR_CODE]; 
  
  toast = signal({ visible: false, mensaje: '', tipo: 'success' });

  constructor(private asistenciaService: AsistenciaService) {}

  onCodeResult(result: string) {
    if (!this.scannerEnabled) return;

    this.scannerEnabled = false;
    // Limpiamos la clave (por si el QR viene como "ID: 123")
    const claveLimpia = result.includes(':') ? result.split(':')[1].trim() : result.trim();

    this.asistenciaService.registrarAsistencia(claveLimpia).subscribe({
      next: (response) => {
        this.mostrarToast(`¡Bienvenido! Entrada registrada`, 'success');
        // Esperamos 4 segundos para reactivar y que no escanee el mismo QR mil veces
        setTimeout(() => this.scannerEnabled = true, 4000);
      },
      error: (err) => {
        let errorMsg = 'Error de conexión';
        
        if (err.status === 404) {
          errorMsg = 'Socio no encontrado';
        } else if (err.status === 422) {
          errorMsg = 'Ya registró su entrada hoy';
        } else if (err.status === 400) {
          errorMsg = 'Código QR inválido';
        }

        this.mostrarToast(errorMsg, 'error');
        // Reactivamos más rápido en caso de error para que el siguiente pueda pasar
        setTimeout(() => this.scannerEnabled = true, 2500);
      }
    });
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.set({ ...this.toast(), visible: false }), 3000);
  }
}