import { Component, input } from '@angular/core';
import { MoveCoreComponent } from '@pdz/shared/widgets/movechart-core/moves.component';
import { MoveChart } from '../../drafts/matchup-overview/matchup-interface';
import { PlannerWidgetComponent } from '../widget/planner-widget.component';

@Component({
  selector: 'pdz-planner-moves',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [MoveCoreComponent, PlannerWidgetComponent],
})
export class MoveComponent {
  readonly movechart = input<MoveChart>();
}
