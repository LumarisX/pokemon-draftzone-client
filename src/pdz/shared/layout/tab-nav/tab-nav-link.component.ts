import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'a[pdz-tab-link], button[pdz-tab-link]',
  template: `<ng-content />`,
  styleUrl: './tab-nav-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-tab-nav__link',
    '[class.pdz-tab-nav__link--active]': 'isActive',
    '[attr.aria-current]': 'isActive ? "page" : null',
  },
})
export class TabNavLinkComponent {
  /** Marks the link active when it isn't a `routerLink` (e.g. a menu trigger). */
  active = input(false, { transform: booleanAttribute });

  private readonly linkActive = inject(RouterLinkActive, {
    optional: true,
    self: true,
  });

  protected get isActive(): boolean {
    return this.active() || (this.linkActive?.isActive ?? false);
  }
}
