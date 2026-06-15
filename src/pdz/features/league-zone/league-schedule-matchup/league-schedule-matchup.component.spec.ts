import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueScheduleMatchupComponent } from './league-schedule-matchup.component';

describe('LeagueScheduleComponent', () => {
  let component: LeagueScheduleMatchupComponent;
  let fixture: ComponentFixture<LeagueScheduleMatchupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueScheduleMatchupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueScheduleMatchupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
