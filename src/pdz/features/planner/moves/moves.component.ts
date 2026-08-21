import { Component, input } from '@angular/core';
import { MoveCoreComponent } from '@pdz/shared/widgets/movechart-core/moves.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { MoveChart } from '../../drafts/matchup-overview/matchup-interface';

@Component({
  selector: 'pdz-planner-moves',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [MoveCoreComponent, WidgetComponent],
})
export class MoveComponent {
  readonly movechart = input<MoveChart>();
}
