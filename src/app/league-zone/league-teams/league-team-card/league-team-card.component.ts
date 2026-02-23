import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-league-team-card',
  imports: [
    CommonModule,
    SpriteComponent,
    PlusSignPipe,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './league-team-card.component.html',
  styleUrls: ['./league-team-card.component.scss', '../../league.scss'],
})
export class LeagueTeamCardComponent {
  @Input({ required: true })
  teamDetails!: League.LeagueTeam;

  data: 'overview' | 'stats' = 'overview';

  getLogoUrl = getLogoUrl;

  getCurrentTimeInTimezone(timezone?: string): string {
    if (!timezone) return '';
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return formatter.format(now);
    } catch (error) {
      return timezone;
    }
  }

  hasCapt(): boolean {
    return this.teamDetails.draft.some(
      (pokemon) => pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
    );
  }

  totalCost() {
    return this.teamDetails.draft.reduce(
      (total, pokemon) => total + pokemon.cost,
      0,
    );
  }

  totalCaptCount() {
    return this.teamDetails.draft.filter(
      (pokemon) => pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
    ).length;
  }
}
