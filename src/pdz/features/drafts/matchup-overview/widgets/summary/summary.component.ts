import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { SummaryCoreComponent } from '@pdz/shared/widgets/summary-core/summary-core.component';
import { Summary } from '../../matchup-interface';

@Component({
  selector: 'pdz-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss', '../../matchup.scss'],
  imports: [
    SummaryCoreComponent,
    FormsModule,
    ReactiveFormsModule,
    SwapOpponentButton,
  ],
})
export class SummaryComponent {
  @Input()
  summaries: Summary[] = [];
  opponent: boolean = true;
}
