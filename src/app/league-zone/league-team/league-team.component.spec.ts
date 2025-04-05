import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTeamComponent } from './league-team.component';

describe('LeagueTeamComponent', () => {
  let component: LeagueTeamComponent;
  let fixture: ComponentFixture<LeagueTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
