import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterObrera } from './registereobrera';

describe('RegisterObrera', () => {
    let component: RegisterObrera;
    let fixture: ComponentFixture<RegisterObrera>;    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterObrera]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RegisterObrera);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
