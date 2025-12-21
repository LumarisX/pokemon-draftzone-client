
import { Component, Input } from '@angular/core';
import { MoveCoreComponent } from '../../../../util/matchup/movechart-core/moves.component';
import { MoveChart } from '../../matchup-interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '../../../../util/buttons/swap-opponent/swap-opponent.component';

@Component({
  selector: 'movechart',
  templateUrl: './movechart.component.html',
  styleUrls: ['../../matchup.scss', './movechart.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MoveCoreComponent,
    SwapOpponentButton
],
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];
  opponent: boolean = true;
}
