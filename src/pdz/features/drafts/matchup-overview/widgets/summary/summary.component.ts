import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { SummaryCoreComponent } from '@pdz/shared/widgets/summary-core/summary-core.component';
import { Summary } from '../../matchup-interface';

@Component({
  selector: 'pdz-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  imports: [
    SummaryCoreComponent,
    FormsModule,
    ReactiveFormsModule,
    SwapOpponentButton,
    WidgetComponent,
  ],
  host: {
    '[class.alternate]': 'opponent',
  },
})
export class SummaryComponent {
  readonly summaries = input<Summary[]>([]);
  opponent: boolean = true;
}
