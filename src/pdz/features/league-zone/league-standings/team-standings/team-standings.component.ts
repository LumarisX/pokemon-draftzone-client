import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-team-standings',
  imports: [CommonModule, MatIconModule, PlusSignPipe],
  templateUrl: './team-standings.component.html',
  styleUrls: ['./team-standings.component.scss'],
})
export class TeamStandingsComponent {
  readonly standingData = input.required<League.TeamStandingsTable>();

  getDiffValue(team: League.TeamStandingData): number {
    return this.standingData().diffMode === 'game'
      ? team.gameDiff
      : team.pokemonDiff;
  }

  getLogoUrl = getLogoUrl;
}
