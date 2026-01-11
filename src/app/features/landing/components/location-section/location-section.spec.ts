import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationSection } from './location-section';

describe('LocationSection', () => {
    let component: LocationSection;
    let fixture: ComponentFixture<LocationSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LocationSection]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LocationSection);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
