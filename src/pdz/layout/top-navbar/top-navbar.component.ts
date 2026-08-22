import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ADMIN_PATH, DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { NavContextService } from '@pdz/core/services/nav-context.service';
import { RoleService } from '@pdz/core/services/role.service';
import { UnreadService } from '@pdz/features/pages/homepage/unread.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { BadgeComponent } from '@pdz/shared/data/badge/badge.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  startWith,
} from 'rxjs';
import { LoginButtonComponent } from './login-button/login-button.component';

interface NavTab {
  title: string;
  route: string;
  badge?: BehaviorSubject<string>;
}

interface NavTool {
  title: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'pdz-top-navbar',
  imports: [
    AsyncPipe,
    RouterModule,
    IconComponent,
    LoginButtonComponent,
    ButtonComponent,
    BadgeComponent,
    TabNavComponent,
    TabNavLinkComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent {
  private unreadService = inject(UnreadService);
  private router = inject(Router);

  readonly adminPath = `/${ADMIN_PATH}/users`;
  readonly isAdmin$ = inject(RoleService).isAdmin$;
  readonly navContext = inject(NavContextService).context;

  readonly TABS: NavTab[] = [
    { title: 'My Drafts', route: DRAFT_OVERVIEW_PATH },
    { title: 'Planner', route: '/planner' },
    { title: 'Replay Analyzer', route: '/tools/replay-analyzer' },
    {
      title: 'Find A League',
      route: '/league-list',
      badge: this.unreadService.leagueCount,
    },
  ];

  readonly TOOLS: NavTool[] = [
    { title: 'One-Time Matchup', route: '/tools/quick-matchup', icon: 'bolt' },
    {
      title: 'Quick Draft',
      route: '/tools/quick-draft',
      icon: 'playing_cards',
    },

    {
      title: 'Time Converter',
      route: '/tools/time-converter',
      icon: 'calendar_clock',
    },
    { title: 'Pokemon Search', route: '/tools/pokemon-search', icon: 'search' },
    { title: 'Wheel Randomizer', route: '/tools/wheel', icon: 'casino' },
  ];

  readonly newsBadge = this.unreadService.newsCount;

  readonly anyBadge$ = combineLatest(
    this.TABS.map((tab) => tab.badge ?? of('')),
  ).pipe(map((badges) => badges.some((badge) => badge !== '')));

  readonly toolsActive$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const url = this.router.url.split(/[?#]/)[0];
      return this.TOOLS.some(
        (tool) => url === tool.route || url.startsWith(`${tool.route}/`),
      );
    }),
  );
}
