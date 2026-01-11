import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsSection } from './about-us-section';

describe('AboutUsSection', () => {
    let component: AboutUsSection;
    let fixture: ComponentFixture<AboutUsSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AboutUsSection]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AboutUsSection);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
