import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerRankingsComponent } from './power-rankings.component';

describe('LeagueTeamComponent', () => {
  let component: PowerRankingsComponent;
  let fixture: ComponentFixture<PowerRankingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerRankingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PowerRankingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
