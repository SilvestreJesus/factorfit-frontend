import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainersSection } from './trainers-section';

describe('TrainersSection', () => {
    let component: TrainersSection;
    let fixture: ComponentFixture<TrainersSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrainersSection]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TrainersSection);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
