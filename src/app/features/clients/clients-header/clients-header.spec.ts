import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsHeader } from './clients-header';

describe('ClientsHeader', () => {
    let component: ClientsHeader;
    let fixture: ComponentFixture<ClientsHeader>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientsHeader]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClientsHeader);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
