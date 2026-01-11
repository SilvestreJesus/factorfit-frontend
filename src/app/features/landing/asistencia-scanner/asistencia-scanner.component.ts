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
  // Definimos el formato usando el ENUM de la librería
  allowedFormats = [BarcodeFormat.QR_CODE]; 
  
  toast = signal({ visible: false, mensaje: '', tipo: 'success' });

  constructor(private asistenciaService: AsistenciaService) {}

  onCodeResult(result: string) {
    if (!this.scannerEnabled) return;

    this.scannerEnabled = false;
    const claveLimpia = result.includes(':') ? result.split(':')[1].trim() : result.trim();

    this.asistenciaService.registrarAsistencia(claveLimpia).subscribe({
      next: (response) => {
        this.mostrarToast(`Entrada Registrada: ${claveLimpia}`, 'success');
        setTimeout(() => this.scannerEnabled = true, 4000);
      },
      error: (err) => {
        const errorMsg = err.status === 404 ? 'Socio no existe' : 'Error de registro';
        this.mostrarToast(errorMsg, 'error');
        setTimeout(() => this.scannerEnabled = true, 3000);
      }
    });
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => this.toast.set({ ...this.toast(), visible: false }), 3000);
  }
}