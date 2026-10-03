import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type RecordSize = 'sm' | 'md';
export type RecordVariant = 'boxes' | 'inline';

@Component({
  selector: 'pdz-record',
  template: `
    @if (variant() === 'boxes') {
      <span class="pdz-record__box pdz-record__box--win">{{ wins() }}</span>
      @if (showDraws()) {
        <span class="pdz-record__box pdz-record__box--draw">{{
          draws()
        }}</span>
      }
      <span class="pdz-record__box pdz-record__box--loss">{{ losses() }}</span>
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
