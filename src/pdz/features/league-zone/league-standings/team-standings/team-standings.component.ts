import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-team-standings',
  imports: [CommonModule, IconComponent, PlusSignPipe],
  templateUrl: './team-standings.component.html',
  styleUrls: ['./team-standings.component.scss'],
})
export class TeamStandingsComponent {
  readonly standingData = input.required<League.TeamStandingsTable>();

  protected readonly showDraws = computed(() =>
    this.standingData().teams.some((team) => (team.draws ?? 0) > 0),
  );

  protected readonly showPoints = computed(
    () =>
      this.showDraws() || (this.standingData().rules?.points.loss ?? 0) > 0,
  );

  getDiffValue(team: League.TeamStandingData): number {
    return this.standingData().diffMode === 'game'
      ? team.gameDiff
      : team.pokemonDiff;
  }

  getLogoUrl = getLogoUrl;
}
