import { Component, OnInit, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LeagueZoneService } from '../../services/league-zone.service';
import { MatchupCardComponent } from '../league-schedule/matchup-card/matchup-card.component';
import { CoachStandingsComponent } from '../league-standings/coach-standings/coach-standings.component';
import { LeagueTeamCardComponent } from '../league-teams/league-team-card/league-team-card.component';
import { League } from '../league.interface';
import { ChatComponent } from '../../components/chat/chat.component';

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
  styleUrl: './league.component.scss',
})
export class LeagueDashboardComponent implements OnInit {
  private leagueZoneService = inject(LeagueZoneService);
  private route = inject(ActivatedRoute);

  team!: any;
  matchups: League.Matchup[] = [];
  leagueId?: string;

  ngOnInit(): void {
    this.leagueZoneService
      .getMatchups()
      .subscribe((matchups) => (this.matchups = matchups));

    this.leagueZoneService
      .getTeamDetail(4)
      .subscribe((team) => (this.team = team));

    this.route.params.subscribe((params) => {
      this.leagueId = params['leagueId'];
    });
  }
}
