import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientRegistration } from './client-registration';

describe('ClientRegistration', () => {
    let component: ClientRegistration;
    let fixture: ComponentFixture<ClientRegistration>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientRegistration]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClientRegistration);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
