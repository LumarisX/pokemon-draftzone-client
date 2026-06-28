import { AsyncPipe } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  startWith,
} from 'rxjs';
import { ADMIN_PATH, DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { RoleService } from '@pdz/core/services/role.service';
import { UnreadService } from '@pdz/features/pages/homepage/unread.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
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
    OverlayModule,
    RouterModule,
    IconComponent,
    LoginButtonComponent,
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent {
  private unreadService = inject(UnreadService);
  private router = inject(Router);

  readonly adminPath = `/${ADMIN_PATH}/users`;
  readonly isAdmin$ = inject(RoleService).isAdmin$;

  mobileMenuOpen = false;
  toolsMenuOpen = false;

  readonly menuPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];

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

  closeMenus(): void {
    this.mobileMenuOpen = false;
    this.toolsMenuOpen = false;
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenus();
    }
  }
}
