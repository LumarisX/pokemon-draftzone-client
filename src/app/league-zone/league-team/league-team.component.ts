import { Component, inject, OnInit } from '@angular/core';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../../drafts/matchup-overview/matchup-interface';
import { LoadingComponent } from '../../images/loading/loading.component';
import { PlannerCoverageComponent } from '../../planner/coverage/coverage.component';
import { MoveComponent } from '../../planner/moves/moves.component';
import { PlannerSummaryComponent } from '../../planner/summary/summary.component';
import { PlannerTypechartComponent } from '../../planner/typechart/typechart.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';

@Component({
  selector: 'pdz-league-team',
  imports: [
    LoadingComponent,

    PlannerSummaryComponent,
    PlannerTypechartComponent,
    MoveComponent,
    PlannerCoverageComponent,
  ],
  templateUrl: './league-team.component.html',
  styleUrl: './league-team.component.scss',
})
export class LeagueTeamComponent implements OnInit {
  leagueService = inject(LeagueZoneService);

  isLoaded?: boolean;
  team!: { name: string; index: number };
  summary!: Summary;
  coverage!: Coverage;
  typechart: TypeChart = {
    team: [],
  };
  movechart: MoveChart = [];

  ngOnInit() {
    this.leagueService.getTeamDetails().subscribe((data) => {
      this.team = data.team;
      this.coverage = data.coverage;
      this.typechart = data.typechart;
      this.summary = data.summary;
      this.movechart = data.movechart;
      this.isLoaded = true;
    });
  }
}
