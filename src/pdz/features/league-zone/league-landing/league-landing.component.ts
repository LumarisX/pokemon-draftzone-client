import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { getLeagueLogoUrl } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';

type TournamentStatus = 'upcoming' | 'active' | 'completed';

const STATUS: Record<TournamentStatus, { label: string; tone: ChipTone }> = {
  upcoming: { label: 'Upcoming', tone: 'info' },
  active: { label: 'In Season', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
};

@Component({
  selector: 'pdz-league-landing',
  templateUrl: './league-landing.component.html',
  styleUrl: './league-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
    TeamLogoComponent,
  ],
})
export class LeagueLandingComponent {
  readonly getLogoUrl = getLeagueLogoUrl;

  readonly league = toSignal(
    inject(LeagueZoneService)
      .getLeague()
      .pipe(catchError(() => of(null))),
  );

  readonly tournaments = computed(() => {
    const now = Date.now();
    return (this.league()?.tournaments ?? []).map((tournament) => {
      const status = this.statusOf(tournament, now);
      const over = status === 'completed';
      return {
        tournament,
        status: STATUS[status],
        over,
        signUpOpen:
          !over &&
          !!tournament.signUpDeadline &&
          now <= new Date(tournament.signUpDeadline).getTime(),
      };
    });
  });

  private statusOf(
    tournament: League.TournamentSummary,
    now: number,
  ): TournamentStatus {
    if (tournament.seasonEnd && now > new Date(tournament.seasonEnd).getTime())
      return 'completed';
    if (
      tournament.seasonStart &&
      now >= new Date(tournament.seasonStart).getTime()
    )
      return 'active';
    return 'upcoming';
  }
}
