import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TeamsComponent } from './teams/teams.component';
import { draftTeamList } from './draft-team-list';
import { Team } from './team';
import { TypechartComponent } from './typechart/typechart.component';
import { SummeryComponent } from './summery/summery.component';
import { FilterSearchComponent } from './filter-search/filter-search.component';
import { BattlePokedex } from './pokedex';
import { ServerService } from './server.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, RouterOutlet, TeamsComponent, TypechartComponent, SummeryComponent, FilterSearchComponent],
})
export class AppComponent {
  title = 'DraftZone';
  teams: Team[] = [];
  dex = BattlePokedex;
  serverService: ServerService = inject(ServerService);

  constructor() {
    this.serverService.getLeagues().subscribe(data=> {
      this.teams = <Team[]>data;
    });
  }
}
