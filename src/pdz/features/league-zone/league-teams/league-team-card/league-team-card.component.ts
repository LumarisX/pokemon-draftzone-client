import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';

@Component({
  selector: 'pdz-league-team-card',
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    SpriteComponent,
    IconComponent,
    RecordComponent,
    RouterLink,
    TeamComponent,
  ],
  templateUrl: './league-team-card.component.html',
  styleUrl: './league-team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTeamCardComponent {
  readonly teamDetails = input.required<League.LeagueTeam>();

  readonly view = signal<'overview' | 'stats'>('overview');

  readonly logoSrc = computed(() => getTeamLogoSrc(this.teamDetails().logo));

  readonly localTime = computed(() => {
    const timezone = this.teamDetails().timezone;
    if (!timezone) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date());
    } catch {
      return timezone;
    }
  });

  readonly hiddenPicksMessage = computed(() => {
    const count = this.teamDetails().pickCount ?? 0;
    return `${count} ${count === 1 ? 'pick' : 'picks'} made so far.`;
  });

  readonly hasCapt = computed(() =>
    this.teamDetails().draft.some(
      (pokemon) => pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
    ),
  );

  readonly totalCost = computed(() =>
    this.teamDetails().draft.reduce((total, pokemon) => total + pokemon.cost, 0),
  );

  readonly totalCaptCount = computed(
    () =>
      this.teamDetails().draft.filter(
        (pokemon) =>
          pokemon.capt?.tera || pokemon.capt?.dmax || pokemon.capt?.z,
      ).length,
  );
}
