import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrCodeModal } from './qr-code-modal';

describe('QrCodeModal', () => {
  let component: QrCodeModal;
  let fixture: ComponentFixture<QrCodeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrCodeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
