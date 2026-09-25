import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-league-team-card',
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    SpriteComponent,
    IconComponent,
    RouterLink,
  ],
  templateUrl: './league-team-card.component.html',
  styleUrls: ['./league-team-card.component.scss', '../../league.scss'],
})
export class LeagueTeamCardComponent {
  readonly teamDetails = input.required<League.LeagueTeam>();

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

  hiddenPicksMessage(): string {
    const count = this.teamDetails().pickCount ?? 0;
    return `${count} ${count === 1 ? 'pick' : 'picks'} made so far.`;
  }

  hasCapt(): boolean {
    return this.teamDetails().draft.some(
      (pokemon) => pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
    );
  }

  totalCost() {
    return this.teamDetails().draft.reduce(
      (total, pokemon) => total + pokemon.cost,
      0,
    );
  }

  totalCaptCount() {
    return this.teamDetails().draft.filter(
      (pokemon) => pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
    ).length;
  }
}
