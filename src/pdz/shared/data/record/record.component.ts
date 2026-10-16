import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { ResultBoxComponent } from '@pdz/shared/data/result-box/result-box.component';

export type RecordSize = 'sm' | 'md' | 'lg';
export type RecordVariant = 'boxes' | 'inline';

@Component({
  selector: 'pdz-record',
  imports: [ResultBoxComponent],
  template: `
    @if (variant() === 'boxes') {
      <pdz-result-box result="win" [size]="size()">{{ wins() }}</pdz-result-box>
      @if (showDraws()) {
        <pdz-result-box result="draw" [size]="size()">{{
          draws()
        }}</pdz-result-box>
      }
      <pdz-result-box result="loss" [size]="size()">{{
        losses()
      }}</pdz-result-box>
    } @else {
      {{ inline() }}
    }
  `,
  styleUrl: './record.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-record',
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class RecordComponent {
  readonly wins = input.required<number>();
  readonly losses = input.required<number>();
  readonly draws = input<number | null | undefined>();
  readonly alwaysShowDraws = input(false, { transform: booleanAttribute });
  readonly size = input<RecordSize>('md');
  readonly variant = input<RecordVariant>('boxes');

  protected readonly showDraws = computed(
    () => this.alwaysShowDraws() || !!this.draws(),
  );

  protected readonly inline = computed(() =>
    this.showDraws()
      ? `${this.wins()}–${this.draws() ?? 0}–${this.losses()}`
      : `${this.wins()}–${this.losses()}`,
  );

  protected readonly label = computed(() => {
    const parts = [`${this.wins()} ${this.wins() === 1 ? 'win' : 'wins'}`];
    if (this.showDraws()) {
      const draws = this.draws() ?? 0;
      parts.push(`${draws} ${draws === 1 ? 'draw' : 'draws'}`);
    }
    parts.push(`${this.losses()} ${this.losses() === 1 ? 'loss' : 'losses'}`);
    return parts.join(', ');
  });
}
