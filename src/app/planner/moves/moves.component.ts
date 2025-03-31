import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MoveChart } from '../../drafts/matchup-overview/matchup-interface';
import { MoveCoreComponent } from '../../util/matchup/movechart-core/moves.component';

@Component({
  selector: 'planner-moves',
  standalone: true,
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [CommonModule, MoveCoreComponent],
})
export class MoveComponent {
  @Input()
  movechart: MoveChart = [];
}
