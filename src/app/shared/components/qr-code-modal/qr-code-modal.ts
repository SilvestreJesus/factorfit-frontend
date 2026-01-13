import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-qr-code-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './qr-code-modal.html',
})

export class QrCodeModal {
    @Input() user: any;
    @Output() close = new EventEmitter<void>();

    apiUrl = environment.apiUrl;

    onClose() {
        this.close.emit();
    }

    // URL para mostrar en el HTML
getQRUrl() {
    if (!this.user?.qr_imagen) return '';

    // Si la ruta ya es una URL completa (Cloudinary o externa), la retornamos
    if (this.user.qr_imagen.startsWith('http')) {
        return this.user.qr_imagen;
    }

    // Si es una ruta local, extraemos solo el nombre del archivo para evitar duplicar carpetas
    const filename = this.user.qr_imagen.split('/').pop();
    return `${this.apiUrl}/api/qr/${filename}`;
}

// URL específica para descargar (ajustada con la misma lógica)
getDownloadUrl() {
    if (!this.user?.qr_imagen) return '';
    
    if (this.user.qr_imagen.startsWith('http')) {
        return this.user.qr_imagen;
    }

    const filename = this.user.qr_imagen.split('/').pop();
    return `${this.apiUrl}/api/qr-download/${filename}`;
}



    async downloadQR() {
        if (!this.user?.qr_imagen) return;

        const fileUrl = this.getDownloadUrl(); // Usamos la nueva ruta
        const fileName = `QR_${this.user.nombres || 'Cliente'}.png`;

        try {
            const response = await fetch(fileUrl, {
                method: 'GET',
                mode: 'cors',
            });

            if (!response.ok) throw new Error('Error al descargar el archivo');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error en la descarga:', error);
            // Si el fetch falla por alguna razón de red, 
            // intentamos abrir la ruta de descarga directamente
            window.location.href = fileUrl;
        }
    }
}