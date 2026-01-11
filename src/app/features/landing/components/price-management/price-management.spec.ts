import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceManagement } from './price-management';

describe('PriceManagement', () => {
    let component: PriceManagement;
    let fixture: ComponentFixture<PriceManagement>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PriceManagement]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PriceManagement);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
