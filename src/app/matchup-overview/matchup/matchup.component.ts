import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { MovechartComponent } from './movechart/movechart.component';
import { OverviewComponent } from './overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummeryComponent } from './summery/summery.component';
import { TypechartComponent } from './typechart/typechart.component';
import {
  CoverageChart,
  MoveChart,
  SpeedChart,
  Summery,
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
    SummeryComponent,
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
  summery: Summery[] = [];
  overview: Summery[] = [];
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
    this.matchupService.getSummery(this.matchupId).subscribe((data) => {
      this.overview = <Summery[]>data;
      this.summery = <Summery[]>JSON.parse(JSON.stringify(data));
    });
    this.matchupService.getSpeedchart(this.matchupId).subscribe((data) => {
      this.speedChart = <SpeedChart>data;
    });

  }
}
