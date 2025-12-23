import { OverlayModule } from '@angular/cdk/overlay';

import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { MatchupService } from '../../services/matchup.service';
import { TeambuilderService } from '../../services/teambuilder.service';
import { PokemonSet } from '../../tools/teambuilder/pokemon-builder.model';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { MatchupData, TypeChartPokemon } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { MatchupTeambuilderComponent } from './widgets/teambuilder/teambuilder.component';
import { IconComponent } from '../../images/icon/icon.component';

dayjs.extend(duration);

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  styleUrls: ['./matchup.scss', './matchup-overview.component.scss'],
  imports: [
    LoadingComponent,
    MatchupComponent,
    RouterModule,
    MatButtonModule,
    OverlayModule,
    MatIconModule,
    SpriteComponent,
    MatchupTeambuilderComponent,
    IconComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private matchupService = inject(MatchupService);
  private meta = inject(Meta);

  matchupData!: MatchupData;
  matchupId!: string;
  shared: boolean = false;
  shareUrl?: string;
  leagueId?: string;
  timeString?: string;
  copied: boolean = false;
  draftPath = DraftOverviewPath;

  view: 'matchup' | 'teambuilder' = 'matchup';

  teambuilderPanelOpen: boolean = true;
  isResizing: boolean = false;
  panelWidthPercent: number = 40;
  private readonly MIN_WIDTH_PERCENT = 15;
  private readonly MAX_WIDTH_PERCENT = 70;
  isMobile: boolean = false;

  @ViewChild('inputFieldRef') inputFieldRef!: ElementRef;

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
    // Calculate width from right edge (panel is on the right)
    const newWidthPercent = ((containerWidth - mouseX) / containerWidth) * 100;

    // Clamp between min and max
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
      this.shareUrl = 'https://pokemondraftzone.com/matchup/' + this.matchupId;
      this.leagueId = params['teamId'];
      this.matchupService.getMatchup(this.matchupId!).subscribe((data) => {
        this.matchupData = <MatchupData>data;
        if ('gameTime' in this.matchupData) {
          let gameTime = dayjs(this.matchupData.details.gameTime);
          if (gameTime.isValid()) {
            const currentTime = dayjs();
            if (!gameTime.isBefore(currentTime)) {
              const duration = dayjs.duration(gameTime.diff(currentTime));
              const days = Math.floor(Math.abs(duration.asDays()));
              const hours = Math.abs(duration.hours());
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
      });
    });
    this.loadTeam();
  }

  copyToClipboard() {
    if (!this.shareUrl) return;
    navigator.clipboard
      .writeText(this.shareUrl)
      .then(() => {
        console.log('URL copied to clipboard: ' + this.shareUrl);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1000);
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard: ', error);
      });
  }

  team: PokemonSet[] = [];
  private teambuilderService = inject(TeambuilderService);

  loadTeam() {
    this.addPokemonToTeam(this.matchupData.summary[0].team[5]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[4]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[3]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[7]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[0]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[9]);
  }

  getTypechart() {
    const typechart = this.matchupData.typechart[0];
    return [
      {
        ...typechart,
        team: typechart.team.map((t) => {
          const p = this.team.find((p) => p.id === t.id);
          return {
            ...t,
            ...p,
            disabled: !p,
          };
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

  addPokemonToTeam(pokemon: Pokemon) {
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        console.log(pokemonData);
        const pokemonSet = PokemonSet.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
      });
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }
  removePokemonFromTeam(pokemon: Pokemon) {
    this.team = this.team.filter((p) => p.id !== pokemon.id);
  }
}
