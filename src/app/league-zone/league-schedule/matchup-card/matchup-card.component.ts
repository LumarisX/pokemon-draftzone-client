import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../images/icon/icon.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';
import { getNameByPid } from '../../../data/namedex';

@Component({
  selector: 'pdz-matchup-card',
  imports: [CommonModule, SpriteComponent, RouterModule, IconComponent],
  templateUrl: './matchup-card.component.html',
  styleUrls: ['./matchup-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupCardComponent implements OnInit {
  @Input({ required: true }) matchup!: League.Matchup;
  @Input() initiallyOpen: boolean = false;

  leagueService = inject(LeagueZoneService);

  private _isOpen = signal<boolean>(false);
  isOpen = this._isOpen.asReadonly();
  selectedMatch = 0;

  ngOnInit(): void {
    if (this.initiallyOpen && this.matchup.matches.length > 0) {
      this._isOpen.set(true);
    }
  }

  toggleOpen(): void {
    if (this.matchup.matches.length > 0) {
      this._isOpen.update((open) => !open);
    }
  }

  onReplayClick(event: Event): void {
    event.stopPropagation();
    const match = this.matchup.matches[this.selectedMatch];
    if (match?.link) {
      window.open(match.link, '_blank');
    }
  }

  selectMatch(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedMatch = index;
  }

  getLogo(logoUrl?: string): string {
    return getLogoUrl(logoUrl);
  }

  getTeam1Pokemon() {
    const match = this.matchup.matches[this.selectedMatch];
    if (!match) return [];

    return this.matchup.team1.draft.map((pokemon) => {
      const stats = match.team1.team[pokemon.id];
      return {
        ...pokemon,
        status: stats?.brought
          ? stats.deaths
            ? 'fainted'
            : 'brought'
          : undefined,
      };
    });
  }

  getTeam2Pokemon() {
    const match = this.matchup.matches[this.selectedMatch];
    if (!match) return [];

    return this.matchup.team2.draft.map((pokemon) => {
      const stats = match.team2.team[pokemon.id];
      return {
        ...pokemon,
        status: stats?.brought
          ? stats.deaths
            ? 'fainted'
            : 'brought'
          : undefined,
      };
    });
  }

  getTeam(team: { [key: string]: { brought?: number; deaths?: number } }) {
    return Object.entries(team).map(([id, stats]) => ({
      id,
      name: getNameByPid(id),
      status: stats?.brought
        ? stats.deaths
          ? 'fainted'
          : 'brought'
        : undefined,
    }));
  }
}
