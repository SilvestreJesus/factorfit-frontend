import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebtorsComponent } from '../logbook-debtors/logbook-debtors.component';

describe('DebtorsComponent', () => {
    let component: DebtorsComponent;
    let fixture: ComponentFixture<DebtorsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DebtorsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DebtorsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
