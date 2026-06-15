import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupData } from '../matchup-interface';
import { MovechartComponent } from '../widgets/movechart/movechart.component';
import { MatchupNotesComponent } from '../widgets/notes/notes.component';
import { OverviewComponent } from '../widgets/overview/overview.component';
import { SummaryComponent } from '../widgets/summary/summary.component';
import { TypechartComponent } from '../widgets/typechart/typechart.component';
import { CoveragechartComponent } from './coveragechart/coveragechart.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';

@Component({
  selector: 'pdz-matchup',
  templateUrl: './matchup.component.html',
  styleUrl: './matchup.component.scss',
  imports: [
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
}
