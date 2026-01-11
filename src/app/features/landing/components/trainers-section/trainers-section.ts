import { Component, OnInit, ViewChild, ElementRef, HostListener, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { UsuarioService } from '../../../../core/services/usuario.service';
import { environment } from '../../../../../environments/environment';


@Component({
    selector: 'app-trainers-section',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trainers-section.html',
    styleUrls: ['./trainers-section.css']
})
export class TrainersSection implements OnInit {
    isMobile = false;

    trainers: any[] = [];

    @ViewChild('carousel') carousel!: ElementRef;

    constructor(
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
    this.checkScreen();
    this.cargarPersonal();
    }


    @HostListener('window:resize')
    onResize() {
    this.checkScreen();
    }


    checkScreen() {
    if (isPlatformBrowser(this.platformId)) {
        this.isMobile = window.innerWidth <= 640;
    }
    }



    cargarPersonal() {
        this.usuarioService.getPersonal().subscribe({
            next: (data) => {
                this.trainers = data.map((p: any) => ({
                    clave_personal: p.clave_personal,
                    name: p.nombre_completo,
                    puesto: p.puesto,
                    description: p.descripcion ?? '',
                    image: p.ruta_imagen
                        ? `${environment.apiUrl}/${p.ruta_imagen}`
                        : 'assets/no-image.png'
                }));
            }
        });
    }


    currentIndex = 0;

    next() {
    this.currentIndex =
        (this.currentIndex + 1) % this.trainers.length;
    }

    prev() {
    this.currentIndex =
        (this.currentIndex - 1 + this.trainers.length) % this.trainers.length;
    }

    /* TRANSFORMACIÓN 3D */
    getTransform(index: number): string {
    const offset = index - this.currentIndex;

    if (this.isMobile) {
    if (offset === 0) {
        return `
        translate(-50%, -50%)
        scale(1)
        translateZ(60px)
        `;
    }

    if (offset === -1 || offset === this.trainers.length - 1) {
        return `
        translate(-90%, -50%)   /* 🔥 MENOS */
        scale(0.8)
        `;
    }

    if (offset === 1 || offset === -(this.trainers.length - 1)) {
        return `
        translate(-10%, -50%)   /* 🔥 MENOS */
        scale(0.8)
        `;
    }

    return `
        translate(-50%, -50%)
        scale(0.65)
        translateZ(-120px)
    `;
    }


    // ===== DESKTOP =====
    if (offset === 0) {
        return `
        translate(-50%, -50%)
        translateZ(200px)
        scale(1.15)
        `;
    }

    if (offset === -1 || offset === this.trainers.length - 1) {
        return `
        translate(-160%, -50%)
        scale(0.9)
        rotateY(40deg)
        `;
    }

    if (offset === 1 || offset === -(this.trainers.length - 1)) {
        return `
        translate(60%, -50%)
        scale(0.9)
        rotateY(-40deg)
        `;
    }

    return `
        translate(-50%, -50%)
        translateZ(-200px)
        scale(0.7)
    `;
    }

    getZIndex(index: number): number {
    const diff = Math.abs(index - this.currentIndex);
    return 100 - diff;
    }

}
