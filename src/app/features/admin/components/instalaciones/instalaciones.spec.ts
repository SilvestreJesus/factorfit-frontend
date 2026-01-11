import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Instalaciones } from './instalaciones';

describe('instalaciones', () => {
    let component: Instalaciones;
    let fixture: ComponentFixture<Instalaciones>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Instalaciones]
        })
            .compileComponents();

        fixture = TestBed.createComponent(Instalaciones);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
