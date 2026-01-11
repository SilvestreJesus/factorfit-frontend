import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaScannerComponent } from './asistencia-scanner.component';

describe('AsistenciaScannerComponent', () => {
  let component: AsistenciaScannerComponent;
  let fixture: ComponentFixture<AsistenciaScannerComponent>;  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaScannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenciaScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
