import { Component, Input } from '@angular/core';
import { SummaryCoreComponent } from '@pdz/shared/widgets/summary-core/summary-core.component';
import { Summary } from '../../drafts/matchup-overview/matchup-interface';

@Component({
  selector: 'pdz-planner-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  imports: [SummaryCoreComponent],
})
export class PlannerSummaryComponent {
  @Input()
  summary?: Summary;
}
