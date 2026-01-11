import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeClients } from './home_clients';

describe('HomeClients', () => {
  let component: HomeClients;
  let fixture: ComponentFixture<HomeClients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeClients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeClients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
