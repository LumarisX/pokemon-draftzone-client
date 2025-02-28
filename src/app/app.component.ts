import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth0.service';
import { DraftOverviewPath } from './drafts/draft-overview/draft-overview-routing.module';
import { svgIcons } from './images/icons';
import { SettingsService } from './pages/settings/settings.service';
import { LeagueAdsService } from './api/league-ads.service';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  of,
  retry,
} from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  userDropdown = false;
  menuDropdown = false;
  innerClick: undefined | 'user' | 'menu';
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
      badge: this.leagueService.newCount,
    },
    // {
    //   title: 'Other Tools',
    //   route: '/tools',
    // },
  ];

  draftPath = DraftOverviewPath;

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService,
    private leagueService: LeagueAdsService,
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
  }

  ngOnInit(): void {
    if (!localStorage.getItem('shinyunlocked')) {
      let shiny = Math.floor(Math.random() * 100);
      if (shiny === 0) {
        this.settingsService.settingsData.theme = 'shiny';
        localStorage.setItem('shinyunlocked', 'true');
      }
    }
  }

  getTheme() {
    const classes: string[] = [];
    if (this.settingsService.settingsData.ldMode === 'dark')
      classes.push('dark-mode');
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
}
