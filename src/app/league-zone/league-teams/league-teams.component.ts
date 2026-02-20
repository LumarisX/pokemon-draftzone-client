import { Component, inject, OnInit } from '@angular/core';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { LeagueTeamCardComponent } from './league-team-card/league-team-card.component';
import { LoadingComponent } from '../../images/loading/loading.component';

@Component({
  selector: 'pdz-league-teams',
  imports: [LeagueTeamCardComponent, LoadingComponent],
  templateUrl: './league-teams.component.html',
  styleUrls: ['./league-teams.component.scss'],
})
export class LeagueTeamsComponent implements OnInit {
  leagueService = inject(LeagueZoneService);
  teams?: League.LeagueTeam[];

  ngOnInit(): void {
    this.leagueService.getTeams().subscribe((data) => {
      this.teams = data.teams;
      console.log(this.teams);
    });
  }
}
