import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { MeterComponent } from '@pdz/shared/data/meter/meter.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import {
  DashboardTeam,
  isFuture,
  leagueLine,
  ordinal,
  teamLinks,
} from '../dashboard.model';

const EMPTY_ROSTER_SPOTS = 6;

@Component({
  selector: 'pdz-dashboard-team-card',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    CountdownComponent,
    MeterComponent,
    RecordComponent,
    RosterSpritesComponent,
    TeamComponent,
  ],
  templateUrl: './dashboard-team-card.component.html',
  styleUrl: './dashboard-team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTeamCardComponent {
  readonly team = input.required<DashboardTeam>();

  protected readonly ordinal = ordinal;
  protected readonly isFuture = isFuture;

  protected readonly links = computed(() => teamLinks(this.team()));
  protected readonly league = computed(() => leagueLine(this.team()));
  protected readonly logo = computed(() => getTeamLogoSrc(this.team().logo));

  protected readonly spots = computed(() => {
    const team = this.team();
    if (team.phase === 'drafting') return team.draft?.rosterSize ?? 0;
    if (team.phase === 'upcoming' && !team.pokemon.length)
      return EMPTY_ROSTER_SPOTS;
    return 0;
  });

  protected readonly onClock = computed(
    () => this.team().phase === 'drafting' && !!this.team().draft?.onClock,
  );
}
