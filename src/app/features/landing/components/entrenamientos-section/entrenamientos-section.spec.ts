import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntrenamientosSection } from './entrenamientos-section';

describe('EntrenamientosSection', () => {
  let component: EntrenamientosSection;
  let fixture: ComponentFixture<EntrenamientosSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntrenamientosSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntrenamientosSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
