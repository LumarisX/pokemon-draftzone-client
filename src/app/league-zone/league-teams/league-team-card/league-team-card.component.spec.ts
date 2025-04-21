import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTeamCardComponent } from './league-team-card.component';

describe('LeagueTeamComponent', () => {
  let component: LeagueTeamCardComponent;
  let fixture: ComponentFixture<LeagueTeamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTeamCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueTeamCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
