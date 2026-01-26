import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterEmiliano } from './registeremiliano';

describe('RegisterEmiliano', () => {
    let component: RegisterEmiliano;
    let fixture: ComponentFixture<RegisterEmiliano>;    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterEmiliano]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RegisterEmiliano);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
