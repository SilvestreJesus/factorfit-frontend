import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Entrenamientos } from './entrenamientos';

describe('entrenamientos', () => {
    let component: Entrenamientos;
    let fixture: ComponentFixture<Entrenamientos>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Entrenamientos]
        })
            .compileComponents();

        fixture = TestBed.createComponent(Entrenamientos);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
