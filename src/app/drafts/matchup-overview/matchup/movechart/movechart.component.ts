import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MoveCoreComponent } from '../../../../util/matchup/movechart-core/moves.component';
import { MoveChart } from '../../matchup-interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'movechart',
  templateUrl: './movechart.component.html',
  styleUrls: ['../matchup.scss', './movechart.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MoveCoreComponent,
  ],
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];
  opponent: boolean = false;
}
