import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsStats } from './clients-stats';

describe('ClientsStats', () => {
  let component: ClientsStats;
  let fixture: ComponentFixture<ClientsStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
