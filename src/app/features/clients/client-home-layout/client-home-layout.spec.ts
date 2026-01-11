import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientHomeLayout } from './client-home-layout';

describe('ClientHomeLayout', () => {
    let component: ClientHomeLayout;
    let fixture: ComponentFixture<ClientHomeLayout>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientHomeLayout]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClientHomeLayout);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
