import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { MovechartComponent } from './movechart/movechart.component';
import { OverviewComponent } from './overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { summaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';
import {
  CoverageChart,
  MoveChart,
  SpeedChart,
  summary,
  TypeChart,
} from '../matchup-interface';
import { MatchupService } from '../../api/matchup.service';

@Component({
  selector: 'matchup',
  standalone: true,
  templateUrl: './matchup.component.html',
  imports: [
    CommonModule,
    RouterModule,
    summaryComponent,
    SpriteComponent,
    TypechartComponent,
    MovechartComponent,
    SpeedchartComponent,
    CoveragechartComponent,
    OverviewComponent,
  ],
})
export class MatchupComponent implements OnInit {
  @Input() matchupId = '';

  coverageChart: CoverageChart[][] = [];
  moveChart: MoveChart[] = [];
  speedChart: SpeedChart | null = null;
  summary: summary[] = [];
  overview: summary[] = [];
  typeChart: TypeChart[] = [];

  constructor(private matchupService: MatchupService) {}

  ngOnInit(): void {
    this.matchupService.getCoveragechart(this.matchupId).subscribe((data) => {
      this.coverageChart = <CoverageChart[][]>data;
    });
    this.matchupService.getMovechart(this.matchupId).subscribe((data) => {
      this.moveChart = <MoveChart[]>data;
    });
    this.matchupService.getTypechart(this.matchupId).subscribe((data) => {
      this.typeChart = <TypeChart[]>data;
    });
    this.matchupService.getsummary(this.matchupId).subscribe((data) => {
      this.overview = <summary[]>data;
      for (let summary of this.overview) {
        summary.team.sort((x, y) => {
          if (x['baseStats']['spe'] < y['baseStats']['spe']) {
            return 1;
          }
          if (x['baseStats']['spe'] > y['baseStats']['spe']) {
            return -1;
          }
          return 0;
        });
      }
      this.summary = <summary[]>JSON.parse(JSON.stringify(data));
    });
    this.matchupService.getSpeedchart(this.matchupId).subscribe((data) => {
      this.speedChart = <SpeedChart>data;
    });
  }
}
