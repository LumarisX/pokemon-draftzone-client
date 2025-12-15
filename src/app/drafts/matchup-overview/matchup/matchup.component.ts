import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupData } from '../matchup-interface';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { MovechartComponent } from '../widgets/movechart/movechart.component';
import { OverviewComponent } from '../widgets/overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummaryComponent } from '../widgets/summary/summary.component';
import { TypechartComponent } from '../widgets/typechart/typechart.component';
import { MatchupNotesComponent } from '../widgets/notes/notes.component';

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
    MatchupNotesComponent,
  ],
})
export class MatchupComponent {
  @Input({ required: true }) matchupData!: MatchupData;
  @Input() matchupId?: string;
  @Input() options: { notes: 'view-only' | 'editable' } = {
    notes: 'editable',
  };

  constructor() {}
}
