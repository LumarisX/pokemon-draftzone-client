import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  ADMIN_PATH,
  DRAFT_OVERVIEW_PATH,
  LEAGUE_ADS_PATH,
  PLANNER_PATH,
  TOOLS_PATH,
} from '@pdz/core/route-paths';
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
import { filter, map } from 'rxjs';
import { LoginButtonComponent } from './login-button/login-button.component';

interface NavTab {
  title: string;
  route: string;
  badge?: Signal<string>;
}

interface NavTool {
  title: string;
  route: string;
  icon: string;
}

const tool = (path: string) => `/${TOOLS_PATH}/${path}`;

@Component({
  selector: 'pdz-top-navbar',
  imports: [
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  private unreadService = inject(UnreadService);
  private router = inject(Router);

  readonly adminPath = `/${ADMIN_PATH}/users`;
  readonly isAdmin$ = inject(RoleService).isAdmin$;
  readonly navDrawer = inject(NavContextService).drawer;
  readonly newsBadge = this.unreadService.newsCount;

  readonly tabs: NavTab[] = [
    { title: 'My Drafts', route: `/${DRAFT_OVERVIEW_PATH}` },
    { title: 'Planner', route: `/${PLANNER_PATH}` },
    { title: 'Replay Analyzer', route: tool('replay-analyzer') },
    {
      title: 'Find a League',
      route: `/${LEAGUE_ADS_PATH}`,
      badge: this.unreadService.leagueCount,
    },
  ];

  readonly tools: NavTool[] = [
    { title: 'One-Time Matchup', route: tool('quick-matchup'), icon: 'bolt' },
    { title: 'Quick Draft', route: tool('quick-draft'), icon: 'playing_cards' },
    {
      title: 'Time Converter',
      route: tool('time-converter'),
      icon: 'calendar_clock',
    },
    { title: 'Pokémon Search', route: tool('pokemon-search'), icon: 'search' },
    { title: 'Wheel Randomizer', route: tool('wheel'), icon: 'casino' },
  ];

  readonly anyBadge = computed(() =>
    this.tabs.some((tab) => !!tab.badge?.()),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly toolsActive = computed(() => {
    const url = this.url().split(/[?#]/)[0];
    return this.tools.some(
      (item) => url === item.route || url.startsWith(`${item.route}/`),
    );
  });
}
