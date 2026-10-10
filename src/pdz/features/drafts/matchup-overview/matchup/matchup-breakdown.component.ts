import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupData } from '../matchup-interface';
import { MovechartComponent } from '../widgets/movechart/movechart.component';
import { OverviewComponent } from '../widgets/overview/overview.component';
import { SummaryComponent } from '../widgets/summary/summary.component';
import { TypechartComponent } from '../widgets/typechart/typechart.component';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';

@Component({
  selector: 'pdz-matchup-breakdown',
  templateUrl: './matchup-breakdown.component.html',
  styleUrl: './matchup-breakdown.component.scss',
  imports: [
    RouterModule,
    SummaryComponent,
    TypechartComponent,
    MovechartComponent,
    SpeedchartComponent,
    CoveragechartComponent,
    OverviewComponent,
  ],
})
export class MatchupBreakdownComponent {
  readonly matchupData = input.required<MatchupData>();
}
