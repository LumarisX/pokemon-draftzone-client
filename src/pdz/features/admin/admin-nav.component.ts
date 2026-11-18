import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ADMIN_PATH } from '@pdz/core/route-paths';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';

@Component({
  selector: 'pdz-admin-nav',
  imports: [
    RouterLink,
    RouterLinkActive,
    TabNavComponent,
    TabNavLinkComponent,
  ],
  template: `
    <pdz-tab-nav label="Admin sections">
      @for (link of links; track link.path) {
        <a pdz-tab-link [routerLink]="link.route" routerLinkActive>{{
          link.label
        }}</a>
      }
    </pdz-tab-nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNavComponent {
  protected readonly links = [
    { path: 'users', label: 'Users' },
    { path: 'chat-reports', label: 'Chat Reports' },
    { path: 'reset-display-name', label: 'Reset Display Name' },
  ].map((link) => ({ ...link, route: ['/', ADMIN_PATH, link.path] }));
}
