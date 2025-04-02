import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupData } from '../matchup-interface';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { MovechartComponent } from './movechart/movechart.component';
import { OverviewComponent } from './overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';

@Component({
  selector: 'matchup',
  templateUrl: './matchup.component.html',
  styleUrl: './matchup.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SummaryComponent,
    TypechartComponent,
    MovechartComponent,
    SpeedchartComponent,
    CoveragechartComponent,
    OverviewComponent,
  ],
})
export class MatchupComponent {
  @Input() matchupData!: MatchupData;

  constructor() {}
}
