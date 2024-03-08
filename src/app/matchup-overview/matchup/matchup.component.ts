import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupService } from '../../api/matchup.service';
import { SpriteComponent } from '../../sprite/sprite.component';
import {
  CoverageChart,
  MatchupData,
  MoveChart,
  SpeedChart,
  Summary,
  TypeChart
} from '../matchup-interface';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { MovechartComponent } from './movechart/movechart.component';
import { OverviewComponent } from './overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';

@Component({
  selector: 'matchup',
  standalone: true,
  templateUrl: './matchup.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SummaryComponent,
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
  summary: Summary[] = [];
  overview: Summary[] = [];
  typeChart: TypeChart[] = [];
  matchupData: MatchupData | null = null

  constructor(private matchupService: MatchupService) {}

  ngOnInit(): void {
    this.matchupService.getMatchup(this.matchupId).subscribe((data) => {
      this.matchupData = <MatchupData>data;
      for (let summary of this.matchupData.summery) {
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
      this.matchupData.overview = <Summary[]>JSON.parse(JSON.stringify(data));
    });
    // this.matchupService.getCoveragechart(this.matchupId).subscribe((data) => {
    //   this.coverageChart = <CoverageChart[][]>data;
    // });
    // this.matchupService.getMovechart(this.matchupId).subscribe((data) => {
    //   this.moveChart = <MoveChart[]>data;
    // });
    // this.matchupService.getTypechart(this.matchupId).subscribe((data) => {
    //   this.typeChart = <TypeChart[]>data;
    // });
    // this.matchupService.getsummary(this.matchupId).subscribe((data) => {
    //   this.overview = <Summary[]>data;
    //   for (let summary of this.overview) {
    //     summary.team.sort((x, y) => {
    //       if (x['baseStats']['spe'] < y['baseStats']['spe']) {
    //         return 1;
    //       }
    //       if (x['baseStats']['spe'] > y['baseStats']['spe']) {
    //         return -1;
    //       }
    //       return 0;
    //     });
    //   }
    //   this.summary = <Summary[]>JSON.parse(JSON.stringify(data));
    // });
    // this.matchupService.getSpeedchart(this.matchupId).subscribe((data) => {
    //   this.speedChart = <SpeedChart>data;
    // });
  }
}
