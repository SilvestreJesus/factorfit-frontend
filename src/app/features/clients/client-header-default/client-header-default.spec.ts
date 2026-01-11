import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientHeaderDefault } from './client-header-default';

describe('ClientHeaderDefault', () => {
    let component: ClientHeaderDefault;
    let fixture: ComponentFixture<ClientHeaderDefault>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientHeaderDefault]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClientHeaderDefault);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
