import { Directive, inject } from '@angular/core';
import { RouterLinkActive } from '@angular/router';

@Directive({
  selector: 'a[pdz-tab-link]',
  host: {
    class: 'pdz-tab-nav__link',
    '[class.pdz-tab-nav__link--active]': 'active',
    '[attr.aria-current]': 'active ? "page" : null',
  },
})
export class TabNavLinkDirective {
  private readonly linkActive = inject(RouterLinkActive, {
    optional: true,
    self: true,
  });

  get active(): boolean {
    return this.linkActive?.isActive ?? false;
  }
}
