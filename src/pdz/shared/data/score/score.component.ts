import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeTone } from '@pdz/shared/data/badge/badge.component';

@Component({
  selector: 'pdz-score',
  template: `<ng-content />`,
  styleUrl: './score.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-score',
    '[attr.data-tone]': 'tone()',
  },
})
export class ScoreComponent {
  tone = input<BadgeTone>('neutral');
}
