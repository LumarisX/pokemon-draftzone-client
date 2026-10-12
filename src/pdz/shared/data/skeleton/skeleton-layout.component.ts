import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

export type SkeletonLayout =
  | 'list'
  | 'table'
  | 'cards'
  | 'form'
  | 'text'
  | 'board'
  | 'chart';

const DEFAULT_COUNT: Record<SkeletonLayout, number> = {
  list: 5,
  table: 6,
  cards: 6,
  form: 4,
  text: 3,
  board: 4,
  chart: 1,
};

const CELL_WIDTHS = ['70%', '40%', '55%', '30%'];

@Component({
  selector: 'pdz-skeleton-layout',
  imports: [SkeletonComponent],
  templateUrl: './skeleton-layout.component.html',
  styleUrl: './skeleton-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-skeleton-layout',
    role: 'status',
    '[attr.data-layout]': 'layout()',
  },
})
export class SkeletonLayoutComponent {
  readonly layout = input<SkeletonLayout>('list');
  readonly count = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === ''
        ? undefined
        : numberAttribute(value),
  });
  readonly label = input('Loading');

  protected readonly cellWidths = CELL_WIDTHS;

  protected readonly items = computed(() =>
    Array.from(
      { length: Math.max(1, this.count() ?? DEFAULT_COUNT[this.layout()]) },
      (_, index) => index,
    ),
  );
}
