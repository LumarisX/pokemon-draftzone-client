import { Component, inject, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth0.service';
import { DraftOverviewPath } from './draft-overview/draft-overview-routing.module';
import { svgIcons } from './images/icons';
import { SettingsService } from './pages/settings/settings.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  userDropdown = false;
  menuDropdown = false;
  innerClick: undefined | 'user' | 'menu';
  TABS: {
    title: string;
    route: string;
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
    },
    {
      title: 'Other Tools',
      route: '/tools',
    },
  ];

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService,
  ) {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    Object.entries(svgIcons).forEach(([name, data]) => {
      iconRegistry.addSvgIconLiteral(
        name,
        sanitizer.bypassSecurityTrustHtml(data),
      );
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

  outer() {
    if (this.menuDropdown && this.innerClick !== 'menu') {
      this.menuDropdown = false;
    }

    if (this.userDropdown && this.innerClick !== 'user') {
      this.userDropdown = false;
    }
    this.innerClick = undefined;
  }
  inner(menu: 'user' | 'menu') {
    this.innerClick = menu;
  }

  getTheme() {
    switch (this.settingsService.settingsData.theme) {
      case 'shiny':
        return 'shiny dark:darkshiny';
      case 'graymode':
        return 'graycolorblind dark:darkcolorblind';
      case 'christmas':
        return 'christmas dark:darkchristmas';
      default:
        return 'classic dark:darkclassic';
    }
  }
}
