import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTeamsComponent } from './league-teams.component';

describe('LeagueTeamsComponent', () => {
  let component: LeagueTeamsComponent;
  let fixture: ComponentFixture<LeagueTeamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTeamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
