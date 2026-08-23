import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SortDirection, SortDirective } from './sort.directive';

@Component({
  selector: 'th[pdzSortHeader]',
  imports: [IconComponent],
  template: `
    <button type="button" class="pdz-sort-header__button" (click)="toggle()">
      <span class="pdz-sort-header__label"><ng-content /></span>
      <span class="pdz-sort-header__arrow" aria-hidden="true">
        <pdz-icon [name]="arrow()" [size]="16" />
      </span>
    </button>
  `,
  styleUrl: './sort-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-sort-header',
    '[class.pdz-sort-header--sorted]': 'sorted()',
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class SortHeaderComponent {
  private readonly sort = inject(SortDirective);

  readonly id = input.required<string>({ alias: 'pdzSortHeader' });
  readonly start = input<Exclude<SortDirection, ''>>('asc');

  protected readonly direction = computed(() => this.sort.directionFor(this.id()));
  protected readonly sorted = computed(() => this.direction() !== '');

  protected readonly arrow = computed(() =>
    this.direction() === 'desc' ? 'arrow_downward' : 'arrow_upward',
  );

  protected readonly ariaSort = computed(() => {
    switch (this.direction()) {
      case 'asc':
        return 'ascending';
      case 'desc':
        return 'descending';
      default:
        return 'none';
    }
  });

  protected toggle(): void {
    this.sort.sort(this.id(), this.start());
  }
}
