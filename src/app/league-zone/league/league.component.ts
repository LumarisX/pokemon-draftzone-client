import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ChatComponent } from '../../components/chat/chat.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { MatchupCardComponent } from '../league-schedule/matchup-card/matchup-card.component';
import { CoachStandingsComponent } from '../league-standings/coach-standings/coach-standings.component';
import { LeagueTeamCardComponent } from '../league-teams/league-team-card/league-team-card.component';
import { League } from '../league.interface';

@Component({
  selector: 'pdz-league',
  imports: [
    RouterModule,
    MatchupCardComponent,
    MatSidenavModule,
    CoachStandingsComponent,
    ChatComponent,
    LeagueTeamCardComponent,
  ],
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.scss'],
})
export class LeagueDashboardComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();

  team!: any;
  matchups: League.Matchup[] = [];
  leagueId?: string;

  ngOnInit(): void {
    this.leagueZoneService
      .getMatchups()
      .pipe(takeUntil(this.destroy$))
      .subscribe((matchups) => (this.matchups = matchups));

    this.leagueZoneService
      .getTeamDetail(4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => (this.team = team));

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.leagueId = params['leagueId'];
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
