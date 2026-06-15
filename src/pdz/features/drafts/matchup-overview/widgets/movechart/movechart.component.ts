import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { MoveCoreComponent } from '@pdz/shared/widgets/movechart-core/moves.component';
import { MoveChart } from '../../matchup-interface';

@Component({
  selector: 'pdz-movechart',
  templateUrl: './movechart.component.html',
  styleUrls: ['../../matchup.scss', './movechart.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MoveCoreComponent,
    SwapOpponentButton,
  ],
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];
  opponent: boolean = true;
}
