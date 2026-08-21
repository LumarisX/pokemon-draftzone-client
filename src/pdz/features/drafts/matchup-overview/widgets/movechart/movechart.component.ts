import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { MoveCoreComponent } from '@pdz/shared/widgets/movechart-core/moves.component';
import { MoveChart } from '../../matchup-interface';

@Component({
  selector: 'pdz-movechart',
  templateUrl: './movechart.component.html',
  styleUrl: './movechart.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MoveCoreComponent,
    SwapOpponentButton,
    WidgetComponent,
  ],
  host: {
    '[class.alternate]': 'opponent',
  },
})
export class MovechartComponent {
  readonly teams = input.required<MoveChart[]>();
  opponent: boolean = true;
}
