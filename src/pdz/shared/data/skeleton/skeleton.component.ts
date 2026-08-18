import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

export type SkeletonVariant = 'text' | 'block' | 'circle';

@Component({
  selector: 'pdz-skeleton',
  template: `
    @if (variant() === 'text') {
      @for (lineWidth of lineWidths(); track $index) {
        <span
          class="pdz-skeleton__line"
          [style.width]="lineWidth"
          [style.height]="height()"
        ></span>
      }
    }
  `,
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-skeleton',
    'aria-hidden': 'true',
    '[attr.data-variant]': 'variant()',
    '[style.width]': 'width()',
    '[style.height]': 'variant() === "text" ? null : height()',
    '[style.border-radius]': 'radius()',
  },
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>();
  height = input<string>();
  radius = input<string>();
  lines = input(1, { transform: numberAttribute });
  lastLineWidth = input('60%');

  protected lineWidths = computed(() => {
    const count = Math.max(1, Math.floor(this.lines()));
    return Array.from({ length: count }, (_, index) =>
      index === count - 1 && count > 1 ? this.lastLineWidth() : '100%',
    );
  });
}
