import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ResultBoxResult = 'win' | 'loss' | 'draw';
export type ResultBoxSide = 'team1' | 'team2';
export type ResultBoxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'pdz-result-box',
  template: `<ng-content />`,
  styleUrl: './result-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-result-box',
    '[attr.data-result]': 'side() ? null : result()',
    '[attr.data-side]': 'side()',
    '[attr.data-size]': 'size()',
  },
})
export class ResultBoxComponent {
  readonly result = input<ResultBoxResult | null | undefined>(null);
  readonly side = input<ResultBoxSide | null | undefined>(null);
  readonly size = input<ResultBoxSize>('md');
}
