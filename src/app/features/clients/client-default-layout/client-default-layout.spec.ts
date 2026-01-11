import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDefaultLayout } from './client-default-layout';

describe('ClientDefaultLayout', () => {
    let component: ClientDefaultLayout;
    let fixture: ComponentFixture<ClientDefaultLayout>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientDefaultLayout]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClientDefaultLayout);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
