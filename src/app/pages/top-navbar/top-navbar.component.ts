import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { IconComponent } from '../../images/icon/icon.component';
import { UnreadService } from '../../services/unread.service';
import { LoginButtonComponent } from './login-button/login-button.component';

@Component({
  selector: 'pdz-top-navbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatBadgeModule,
    MatIconModule,
    MatToolbarModule,
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

  TABS: {
    title: string;
    route: string;
    badge?: BehaviorSubject<string>;
  }[] = [
    {
      title: 'My Drafts',
      route: DraftOverviewPath,
    },
    {
      title: 'Planner',
      route: '/planner',
    },
    {
      title: 'Replay Analyzer',
      route: '/tools/replay-analyzer',
    },
    // {
    //   title: 'Find A League',
    //   route: '/league-list',
    //   badge: this.unreadService.leagueCount,
    // },
    {
      title: 'Quick Draft',
      route: '/tools/quick-draft',
    },
    // {
    //   title: 'Other Tools',
    //   route: '/tools',
    // },
  ];

  draftPath = DraftOverviewPath;
  newsBadge = this.unreadService.newsCount;

  anyBadge$ = combineLatest(this.TABS.map((tab) => tab.badge ?? of(''))).pipe(
    map((badges) => badges.some((value) => value !== '')),
  );
}
