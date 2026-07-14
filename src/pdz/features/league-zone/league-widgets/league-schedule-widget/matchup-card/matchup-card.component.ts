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
import { getNameByPid } from '@pdz/shared/data/namedex';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { LeagueZoneService } from '../../../league-zone.service';
import { League } from '../../../league.interface';
import { getLogoUrl } from '../../../league.util';

@Component({
  selector: 'pdz-matchup-card',
  imports: [CommonModule, SpriteComponent, RouterModule, IconComponent],
  templateUrl: './matchup-card.component.html',
  styleUrls: ['./matchup-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupCardComponent implements OnInit {
  @Input({ required: true }) matchup!: League.Matchup;
  // The stage the schedule was fetched for. Pages without :stageId in their
  // route (team page, division dashboard) must pass it in — the route-derived
  // service signal is null there.
  @Input() stageId?: string | null;
  @Input() initiallyOpen: boolean = false;

  leagueService = inject(LeagueZoneService);

  get matchupLink(): string[] {
    const stageId = this.stageId ?? this.leagueService.stageId();
    if (!stageId) return [];
    return [
      '/leagues',
      this.leagueService.leagueKey() ?? '',
      'tournaments',
      this.leagueService.tournamentKey() ?? '',
      'stages',
      stageId,
      'schedule',
      'matchups',
      this.matchup.id,
    ];
  }

  private _isOpen = signal<boolean>(false);
  isOpen = this._isOpen.asReadonly();
  selectedMatch = 0;
  replayIndex = 0;

  ngOnInit(): void {
    if (this.initiallyOpen && this.matchup.winner) {
      this._isOpen.set(true);
    }
  }

  toggleOpen(): void {
    if (this.matchup.winner) {
      this._isOpen.update((open) => !open);
    }
  }

  onReplayClick(event: Event): void {
    event.stopPropagation();
    const match = this.matchup.matches[this.replayIndex];
    if (match?.link) {
      window.open(match.link, '_blank');
    }
    this.replayIndex++;
  }

  resetReplays(event: Event): void {
    event.stopPropagation();
    this.replayIndex = 0;
  }

  selectMatch(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedMatch = index;
  }

  getLogo(logoUrl?: string): string {
    return getLogoUrl(logoUrl);
  }

  getTeam(team: League.MatchTeamStats) {
    return Object.entries(team).map(([id, stats]) => ({
      id,
      name: getNameByPid(id),
      status: stats.status,
      kills: (stats.kills?.direct || 0) + (stats.kills?.indirect || 0),
    }));
  }
}
