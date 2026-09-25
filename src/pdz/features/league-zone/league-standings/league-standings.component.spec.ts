import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { EMPTY } from 'rxjs';

import { LeagueStandingsComponent } from './league-standings.component';

describe('LeagueStandingsComponent', () => {
  let component: LeagueStandingsComponent;
  let fixture: ComponentFixture<LeagueStandingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueStandingsComponent],
      providers: [
        {
          provide: EventStreamService,
          useValue: { open: () => {}, close: () => {}, on: () => EMPTY },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueStandingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
