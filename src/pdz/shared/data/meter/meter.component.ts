import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type MeterTone = 'primary' | 'secondary' | 'neutral' | 'warning';
export type MeterSize = 'sm' | 'md';

@Component({
  selector: 'pdz-meter',
  template: `
    @for (fill of fills(); track $index) {
      <span class="pdz-meter__track">
        <span class="pdz-meter__fill" [style.width.%]="fill"></span>
      </span>
    }
  `,
  styleUrl: './meter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-meter',
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-label]': 'label() || null',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
  },
})
export class MeterComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly segments = input(1);
  readonly label = input<string>();
  readonly tone = input<MeterTone>('secondary');
  readonly size = input<MeterSize>('md');

  protected readonly clamped = computed(() =>
    Math.min(Math.max(this.value(), 0), Math.max(this.max(), 0)),
  );

  protected readonly fills = computed(() => {
    const max = this.max();
    const count = Math.max(Math.floor(this.segments()), 1);
    if (max <= 0) return Array<number>(count).fill(0);
    const share = max / count;
    return Array.from({ length: count }, (_, index) => {
      const inSegment = this.clamped() - index * share;
      return Math.min(Math.max(inSegment / share, 0), 1) * 100;
    });
  });
}
