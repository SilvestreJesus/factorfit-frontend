import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsProfile } from './clients-profile';

describe('ClientsProfile', () => {
  let component: ClientsProfile;
  let fixture: ComponentFixture<ClientsProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
