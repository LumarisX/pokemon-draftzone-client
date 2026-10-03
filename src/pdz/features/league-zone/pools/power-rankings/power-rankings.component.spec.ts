import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { of } from 'rxjs';
import { PowerRankingsComponent } from './power-rankings.component';

describe('PowerRankingsComponent', () => {
  let component: PowerRankingsComponent;
  let fixture: ComponentFixture<PowerRankingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerRankingsComponent],
      providers: [
        {
          provide: LeagueZoneService,
          useValue: { powerRankingDetails: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PowerRankingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
