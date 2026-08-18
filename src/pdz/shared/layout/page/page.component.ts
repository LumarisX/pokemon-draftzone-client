import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

export type PageWidth = 'narrow' | 'default' | 'wide' | 'full';

@Component({
  selector: 'pdz-page',
  template: `<div class="pdz-page__inner"><ng-content /></div>`,
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-width]': 'width()',
    '[class.pdz-page--fill]': 'fill()',
    '[class.pdz-page--flush]': 'flush()',
  },
})
export class PageComponent {
  width = input<PageWidth>('full');
  fill = input(false, { transform: booleanAttribute });
  flush = input(false, { transform: booleanAttribute });
}
