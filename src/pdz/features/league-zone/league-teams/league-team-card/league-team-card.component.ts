import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';

@Component({
  selector: 'pdz-league-team-card',
  imports: [
    CardComponent,
    IconComponent,
    RecordComponent,
    RosterSpritesComponent,
    RouterLink,
    TeamComponent,
  ],
  templateUrl: './league-team-card.component.html',
  styleUrl: './league-team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTeamCardComponent {
  readonly teamDetails = input.required<League.LeagueTeam>();
  readonly headingLevel = input<2 | 3>(2);

  readonly logoSrc = computed(() => getTeamLogoSrc(this.teamDetails().logo));

  readonly roster = computed(() =>
    this.teamDetails().picksHidden ? [] : this.teamDetails().draft,
  );

  readonly hiddenSpots = computed(() =>
    this.teamDetails().picksHidden ? (this.teamDetails().pickCount ?? 0) : 0,
  );

  readonly hiddenPicksMessage = computed(() => {
    const count = this.teamDetails().pickCount ?? 0;
    return `${count} ${count === 1 ? 'pick' : 'picks'}, hidden until the draft ends`;
  });

  readonly totalCost = computed(() =>
    this.teamDetails().draft.reduce((total, pokemon) => total + pokemon.cost, 0),
  );
}
