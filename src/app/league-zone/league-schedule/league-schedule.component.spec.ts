import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueScheduleComponent } from './league-schedule.component';

describe('LeagueScheduleComponent', () => {
  let component: LeagueScheduleComponent;
  let fixture: ComponentFixture<LeagueScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
