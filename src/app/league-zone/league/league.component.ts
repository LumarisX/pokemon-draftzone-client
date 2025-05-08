import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { LeagueZoneService } from '../../services/league-zone.service';
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

    LeagueTeamCardComponent,
  ],
  templateUrl: './league.component.html',
  styleUrl: './league.component.scss',
})
export class LeagueComponent implements OnInit {
  team!: any;
  matchups: League.Matchup[] = [];
  constructor(private leagueZoneService: LeagueZoneService) {}

  ngOnInit(): void {
    this.leagueZoneService
      .getMatchups()
      .subscribe((matchups) => (this.matchups = matchups));

    this.leagueZoneService
      .getTeamDetail(4)
      .subscribe((team) => (this.team = team));
  }
}
