import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsSection } from './events-section';

describe('EventsSection', () => {
  let component: EventsSection;
  let fixture: ComponentFixture<EventsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
