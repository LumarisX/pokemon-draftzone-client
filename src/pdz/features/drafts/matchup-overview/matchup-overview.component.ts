import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH, LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { ErrorService } from '@pdz/layout/error/error.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { Observable, combineLatest } from 'rxjs';
import { MatchupData, Summary } from './matchup-interface';
import { DRAFT_MATCHUP_PAGE, MatchupPageConfig } from './matchup-page.config';
import { matchupPath, MatchupService } from './matchup.service';
import { MatchupComponent } from './matchup/matchup.component';
import {
  ShareDialogComponent,
  ShareDialogData,
} from './share-dialog/share-dialog.component';
import { TeambuilderComponent } from '@pdz/features/teambuilder/ui/teambuilder.component';
import type { TeambuilderContext } from '@pdz/features/teambuilder/teambuilder.context';

const SITE_URL = 'https://pokemondraftzone.com';

@Component({
  selector: 'pdz-matchup-overview',
  templateUrl: 'matchup-overview.component.html',
  styleUrls: ['./matchup-overview.component.scss'],
  imports: [
    SkeletonComponent,
    MatchupComponent,
    RouterModule,
    TeambuilderComponent,
    ButtonComponent,
    CountdownComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchupService = inject(MatchupService);
  private errorService = inject(ErrorService);
  private meta = inject(Meta);
  private dialogs = inject(DialogService);

  readonly skeletonDetails = [0, 1, 2, 3];
  readonly skeletonWidgets = ['14rem', '10rem', '18rem', '12rem'];

  config: MatchupPageConfig = DRAFT_MATCHUP_PAGE;
  matchupData?: MatchupData;
  matchupId!: string;
  shareUrl?: string;
  tournamentId?: string;
  draftPath = DRAFT_OVERVIEW_PATH;
  backLink: unknown[] = ['/' + DRAFT_OVERVIEW_PATH];

  teambuilderPanelOpen: boolean = false;
  isResizing: boolean = false;
  panelWidthPercent: number = 40;
  private readonly MIN_WIDTH_PERCENT = 15;
  private readonly MAX_WIDTH_PERCENT = 70;
  isMobile: boolean = false;

  scheduledLabel(): string | null {
    const raw = this.matchupData?.details.scheduledDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  startResize(event: MouseEvent): void {
    if (this.isMobile) return;
    event.preventDefault();
    this.isResizing = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing || this.isMobile) return;

    const containerWidth = window.innerWidth;
    const mouseX = event.clientX;
    const newWidthPercent = ((containerWidth - mouseX) / containerWidth) * 100;

    this.panelWidthPercent = Math.min(
      this.MAX_WIDTH_PERCENT,
      Math.max(this.MIN_WIDTH_PERCENT, newWidthPercent),
    );
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
  }

  ngOnInit(): void {
    this.checkIfMobile();
    window.addEventListener('resize', () => this.checkIfMobile());

    combineLatest([this.route.data, this.route.params]).subscribe(
      ([data, params]) => {
        this.config = (data['matchup'] as MatchupPageConfig) ?? this.config;
        this.matchupId = this.resolveMatchupId(params);
        this.tournamentId = params['teamId'];
        this.shareUrl = this.resolveShareUrl(params);
        this.backLink = this.resolveBackLink(params);
        this.load(params);
      },
    );
  }

  private resolveMatchupId(params: Params): string {
    switch (this.config.source) {
      case 'league':
        return params['matchupSlug'];
      case 'shared':
        return params['id'];
      default:
        return params['matchupId'];
    }
  }

  private resolveShareUrl(params: Params): string {
    if (this.config.source === 'league') {
      return `${SITE_URL}/${LEAGUE_ZONE_PATH}/${params['leagueSlug']}/tournaments/${params['tournamentSlug']}/matchups/${this.matchupId}`;
    }
    return `${SITE_URL}/matchup/${this.matchupId}`;
  }

  private resolveBackLink(params: Params): unknown[] {
    if (this.config.source === 'league') {
      return [
        '/' + LEAGUE_ZONE_PATH,
        params['leagueSlug'],
        'tournaments',
        params['tournamentSlug'],
        'matchups',
        this.matchupId,
      ];
    }
    return this.tournamentId
      ? ['/' + DRAFT_OVERVIEW_PATH, this.tournamentId]
      : ['/' + DRAFT_OVERVIEW_PATH];
  }

  private fetch(params: Params): Observable<MatchupData> {
    if (this.config.source === 'league') {
      return this.matchupService.getLeagueMatchup(
        params['leagueSlug'],
        params['tournamentSlug'],
        this.matchupId,
      );
    }
    return this.matchupService.getMatchup(this.matchupId, {
      suppressErrorReporting: this.config.source === 'draft',
    });
  }

  private load(params: Params): void {
    this.fetch(params).subscribe({
      next: (data) => {
        this.matchupData = data;
        this.teambuilderContext = this.buildTeambuilderContext(data);
        this.updateMetaTags();
      },
      error: (error) => {
        if (
          this.config.source === 'draft' &&
          (error?.status === 401 || error?.status === 403)
        ) {
          this.router.navigate(['/' + matchupPath, this.matchupId]);
          return;
        }
        this.errorService.reportError(error);
      },
    });
  }

  private updateMetaTags(): void {
    if (!this.matchupData) return;
    const [a, b] = this.matchupData.summary;
    this.meta.updateTag({
      name: 'og:title',
      content: `${this.matchupData.details.leagueName} ${this.matchupData.details.stage} | ${a.teamName} vs ${b.teamName}`,
    });
    this.meta.updateTag({
      name: 'og:description',
      content: `View the matchup between ${a.teamName} and ${b.teamName}.`,
    });
    this.meta.updateTag({ name: 'og:url', content: this.shareUrl ?? '' });
  }

  openShareDialog(): void {
    if (!this.matchupData || !this.shareUrl) return;
    this.dialogs.open<ShareDialogComponent, void, ShareDialogData>(
      ShareDialogComponent,
      {
        heading: 'Share your matchup',
        size: 'lg',
        data: { shareUrl: this.shareUrl, matchupData: this.matchupData },
      },
    );
  }

  teambuilderContext: TeambuilderContext | null = null;

  private buildTeambuilderContext(data: MatchupData): TeambuilderContext {
    return {
      type: 'matchup',
      id: this.matchupId,
      ruleset: data.details.ruleset,
      level: data.details.level,
      roster: (data.summary[0]?.team ?? []).map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name,
        shiny: pokemon.shiny,
        nickname: pokemon.nickname,
      })),
      opponent: (data.speedchart.teams[1] ?? []).map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name,
        shiny: pokemon.shiny,
        weak: data.typechart[1]?.team.find(
          (entry) => entry.id === pokemon.id,
        )?.weak[0],
        tiers: pokemon.tiers,
      })),
    };
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

}
