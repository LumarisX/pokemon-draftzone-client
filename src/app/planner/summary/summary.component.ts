
import { Component, Input } from '@angular/core';
import { Summary } from '../../drafts/matchup-overview/matchup-interface';
import { SummaryCoreComponent } from '../../util/matchup/summary-core/summary-core.component';

@Component({
  selector: 'planner-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  imports: [SummaryCoreComponent],
})
export class PlannerSummaryComponent {
  @Input()
  summary?: Summary;
}
