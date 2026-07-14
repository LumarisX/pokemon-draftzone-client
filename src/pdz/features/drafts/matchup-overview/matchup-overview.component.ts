import { Component, HostListener, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { DraftPokemon } from '../draft.model';
import { matchupPath, MatchupService } from './matchup.service';
import { TeambuilderService } from './widgets/teambuilder/teambuilder.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { MatchupData, TypeChartPokemon } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { PokemonBuilder } from './widgets/teambuilder/pokemon-builder/pokemon-builder.model';
import { MatchupTeambuilderComponent } from './widgets/teambuilder/teambuilder.component';
import { ErrorService } from '@pdz/layout/error/error.service';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';

dayjs.extend(duration);

@Component({
  selector: 'pdz-matchup-overview',
  templateUrl: 'matchup-overview.component.html',
  styleUrls: ['./matchup.scss', './matchup-overview.component.scss'],
  imports: [
    LoadingComponent,
    MatchupComponent,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatchupTeambuilderComponent,
    IconComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchupService = inject(MatchupService);
  private errorService = inject(ErrorService);
  private meta = inject(Meta);
  private dialog = inject(MatDialog);

  matchupData?: MatchupData;
  matchupId!: string;
  shareUrl?: string;
  tournamentId?: string;
  timeString?: string;
  draftPath = DRAFT_OVERVIEW_PATH;

  teambuilderPanelOpen: boolean = false;
  isResizing: boolean = false;
  panelWidthPercent: number = 40;
  private readonly MIN_WIDTH_PERCENT = 15;
  private readonly MAX_WIDTH_PERCENT = 70;
  isMobile: boolean = false;

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

    this.route.params.subscribe((params) => {
      this.matchupId = params['matchupId'];
      this.tournamentId = params['teamId'];
      // League schedule matchups (route provides leagueKey/tournamentKey/
      // stageId via inherited params) are served by the stage endpoint;
      // everything else is an external matchup.
      const { leagueKey, tournamentKey, stageId } = params;
      const isLeagueMatchup = !!(leagueKey && tournamentKey && stageId);
      this.shareUrl = isLeagueMatchup
        ? `https://pokemondraftzone.com/leagues/${leagueKey}/tournaments/${tournamentKey}/stages/${stageId}/schedule/matchups/${this.matchupId}`
        : 'https://pokemondraftzone.com/matchup/' + this.matchupId;
      const matchup$ = isLeagueMatchup
        ? this.matchupService.getLeagueMatchup(
            leagueKey,
            tournamentKey,
            stageId,
            this.matchupId,
          )
        : this.matchupService.getMatchup(this.matchupId!);
      matchup$.subscribe({
        next: (data) => {
          this.matchupData = <MatchupData>data;
          if ('gameTime' in this.matchupData) {
            let gameTime = dayjs(this.matchupData.details.gameTime);
            if (gameTime.isValid()) {
              const currentTime = dayjs();
              if (!gameTime.isBefore(currentTime)) {
                const dur = dayjs.duration(gameTime.diff(currentTime));
                const days = Math.floor(Math.abs(dur.asDays()));
                const hours = Math.abs(dur.hours());
                this.timeString =
                  days > 0 ? `${days} days ${hours} hours` : `${hours} hours`;
              } else {
                this.timeString = 'Already past';
              }
            }
          }
          if (this.matchupData) {
            this.meta.updateTag({
              name: 'og:title',
              content: `${this.matchupData.details.leagueName} ${this.matchupData.details.stage} | ${this.matchupData.summary[0].teamName} vs ${this.matchupData.summary[1].teamName}`,
            });
            this.meta.updateTag({
              name: 'og:description',
              content: `View the matchup between ${this.matchupData.summary[0].teamName} and ${this.matchupData.summary[1].teamName}.`,
            });
            this.meta.updateTag({
              name: 'og:url',
              content: this.shareUrl ?? '',
            });
          }
        },
        error: (error) => {
          if (
            !isLeagueMatchup &&
            (error?.status === 401 || error?.status === 403)
          ) {
            this.router.navigate(['/' + matchupPath, this.matchupId]);
            return;
          }
          this.errorService.reportError(error);
        },
      });
    });
    this.loadTeam();
  }

  openShareDialog(): void {
    if (!this.matchupData || !this.shareUrl) return;
    this.dialog.open(ShareDialogComponent, {
      data: { shareUrl: this.shareUrl, matchupData: this.matchupData },
      maxWidth: '50rem',
      width: '100%',
    });
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
