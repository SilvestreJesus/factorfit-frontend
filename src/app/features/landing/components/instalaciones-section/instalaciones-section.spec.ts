import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstalacionesSection } from './instalaciones-section';

describe('InstalacionesSection', () => {
  let component: InstalacionesSection;
  let fixture: ComponentFixture<InstalacionesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstalacionesSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstalacionesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
