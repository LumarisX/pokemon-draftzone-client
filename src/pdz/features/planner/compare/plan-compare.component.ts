import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PlanSummary } from '../planner-context';

@Component({
  selector: 'pdz-plan-compare',
  templateUrl: './plan-compare.component.html',
  styleUrl: './plan-compare.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    RosterSpritesComponent,
    SpriteComponent,
  ],
})
export class PlanCompareComponent {
  readonly plans = input.required<PlanSummary[]>();
  readonly selected = input(0);
  readonly canAdd = input(true);
  readonly showChanges = input(false);

  readonly opened = output<number>();
  readonly duplicated = output<number>();
  readonly removed = output<number>();
}
