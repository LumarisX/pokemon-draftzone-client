import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { LeagueAdsService } from './services/league-ads.service';
import { AuthService } from './services/auth0.service';
import { DraftOverviewPath } from './drafts/draft-overview/draft-overview-routing.module';
import { svgIcons } from './images/icons';
import { SettingsService } from './pages/settings/settings.service';
import { Router } from '@angular/router';
import { UnreadService } from './services/unread.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
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
    {
      title: 'Find A League',
      route: '/league-list',
      badge: this.unreadService.leagueCount,
    },
    // {
    //   title: 'Other Tools',
    //   route: '/tools',
    // },
  ];

  draftPath = DraftOverviewPath;
  newsBadge = this.unreadService.newsCount;

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService,
    private unreadService: UnreadService,
    private router: Router,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
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

  getTheme() {
    const classes: string[] = [];
    if (this.settingsService.settingsData.ldMode === 'dark')
      this.settingsService.updateLDMode(
        this.settingsService.settingsData.ldMode,
      );
    switch (this.settingsService.settingsData.theme) {
      case 'shiny':
        classes.push('shiny dark:darkshiny');
        break;
      case 'graymode':
        classes.push('graycolorblind dark:darkcolorblind');
        break;
      case 'christmas':
        classes.push('christmas dark:darkchristmas');
        break;
      default:
        classes.push('classic dark:darkclassic');
    }
    document.documentElement.setAttribute(
      'theme-name',
      this.settingsService.settingsData.theme ?? '',
    );
    return classes;
  }

  anyBadge$ = combineLatest(this.TABS.map((tab) => tab.badge ?? of(''))).pipe(
    map((badges) => badges.some((value) => value !== '')),
  );

  authenticated: boolean = false;

  checkAuthenticated() {
    this.auth.isAuthenticated().subscribe((authenticated) => {
      this.authenticated = authenticated;
      if (authenticated) {
        this.auth.user().subscribe((data) => {
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
