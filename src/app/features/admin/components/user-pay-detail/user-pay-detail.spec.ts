import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPayDetail } from './user-pay-detail';

describe('UserPayDetail', () => {
  let component: UserPayDetail;
  let fixture: ComponentFixture<UserPayDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPayDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPayDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
