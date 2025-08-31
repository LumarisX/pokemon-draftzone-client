import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { svgIcons } from '../../images/icons';
import { AuthService } from '../../services/auth0.service';
import { UnreadService } from '../../services/unread.service';
import { SettingsComponent } from '../settings/settings.component';
import { SettingsService } from '../settings/settings.service';

@Component({
  selector: 'pdz-top-navbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatBadgeModule,
    OverlayModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    SettingsComponent,
    RouterModule,
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent implements OnInit {
  auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  private unreadService = inject(UnreadService);
  private router = inject(Router);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  settingsOpen: boolean = false;
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

  constructor() {
    const matIconRegistry = this.matIconRegistry;
    const domSanitizer = this.domSanitizer;

    Object.entries(svgIcons).forEach(([name, data]) => {
      matIconRegistry.addSvgIconLiteral(
        name,
        domSanitizer.bypassSecurityTrustHtml(data),
      );
      matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    });
    this.checkAuthenticated();
  }

  ngOnInit(): void {
    const shiny = Math.floor(Math.random() * 100);
    if (shiny === 0) {
      this.settingsService.setSettings({ shinyUnlock: true });
      this.settingsService.updateSettings();
    }
  }

  anyBadge$ = combineLatest(this.TABS.map((tab) => tab.badge ?? of(''))).pipe(
    map((badges) => badges.some((value) => value !== '')),
  );

  authenticated: boolean = false;

  checkAuthenticated() {
    this.auth.isAuthenticated$.subscribe((authenticated) => {
      this.authenticated = authenticated;
      if (authenticated) {
        this.auth.user$.subscribe((data) => {
          this.settingsService.setSettings(data?.settings);
        });
      }
    });
  }

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
