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
import { DraftPokemon } from '../draft.model';
import { MatchupData, Summary, TypeChartPokemon } from './matchup-interface';
import { DRAFT_MATCHUP_PAGE, MatchupPageConfig } from './matchup-page.config';
import { matchupPath, MatchupService } from './matchup.service';
import { MatchupComponent } from './matchup/matchup.component';
import {
  ShareDialogComponent,
  ShareDialogData,
} from './share-dialog/share-dialog.component';
import { PokemonBuilder } from './widgets/teambuilder/pokemon-builder/pokemon-builder.model';
import { MatchupTeambuilderComponent } from './widgets/teambuilder/teambuilder.component';
import { TeambuilderService } from './widgets/teambuilder/teambuilder.service';

const SITE_URL = 'https://pokemondraftzone.com';

@Component({
  selector: 'pdz-matchup-overview',
  templateUrl: 'matchup-overview.component.html',
  styleUrls: ['./matchup-overview.component.scss'],
  imports: [
    SkeletonComponent,
    MatchupComponent,
    RouterModule,
    MatchupTeambuilderComponent,
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
    this.loadTeam();
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

  team: PokemonBuilder[] = [];
  private teambuilderService = inject(TeambuilderService);

  loadTeam() {
    if (!this.matchupData) return;
    this.addPokemonToTeam(this.matchupData.summary[0].team[5]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[4]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[3]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[7]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[0]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[9]);
  }

  getTypechart() {
    if (!this.matchupData) return [];
    const typechart = this.matchupData.typechart[0];
    return [
      {
        ...typechart,
        team: typechart.team.map((t) => {
          const p = this.team.find((p) => p.id === t.id);
          return { ...t, ...p, disabled: !p };
        }),
      },
    ];
  }

  onToggle(pokemon: TypeChartPokemon) {
    if (!pokemon.disabled) {
      this.addPokemonToTeam(pokemon);
    } else {
      this.removePokemonFromTeam(pokemon);
    }
  }

  addPokemonToTeam(pokemon: DraftPokemon) {
    if (!this.matchupData) return;
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        const pokemonSet = PokemonBuilder.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData!.details.level,
        });
        this.team.push(pokemonSet);
      });
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  removePokemonFromTeam(pokemon: DraftPokemon) {
    this.team = this.team.filter((p) => p.id !== pokemon.id);
  }
}
