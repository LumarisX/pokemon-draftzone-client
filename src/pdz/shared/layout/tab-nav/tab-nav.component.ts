import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TabNavAlign = 'start' | 'stretch';

@Component({
  selector: 'pdz-tab-nav',
  template: `
    <nav class="pdz-tab-nav__list" [attr.aria-label]="label()">
      <ng-content />
    </nav>
  `,
  styleUrl: './tab-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-tab-nav',
    '[attr.data-align]': 'align()',
  },
})
export class TabNavComponent {
  align = input<TabNavAlign>('start');
  label = input<string>();
}
