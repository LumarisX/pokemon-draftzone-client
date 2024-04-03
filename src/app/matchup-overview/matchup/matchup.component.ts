import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../images/sprite.component';
import { MatchupData } from '../matchup-interface';
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
export class MatchupComponent {
  @Input() matchupData!: MatchupData;

  constructor() {}
}
