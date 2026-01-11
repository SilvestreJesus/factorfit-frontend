import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPay } from './user-pay';

describe('UserPay', () => {
    let component: UserPay;
    let fixture: ComponentFixture<UserPay>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserPay]
        })
            .compileComponents();

        fixture = TestBed.createComponent(UserPay);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
