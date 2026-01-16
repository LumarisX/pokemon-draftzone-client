import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { IconComponent } from '../../images/icon/icon.component';
import { UnreadService } from '../../services/unread.service';
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
    CommonModule,
    MatToolbarModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    IconComponent,
    LoginButtonComponent,
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent {
  private unreadService = inject(UnreadService);

  readonly TABS: NavTab[] = [
    { title: 'My Drafts', route: DraftOverviewPath },
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
}
