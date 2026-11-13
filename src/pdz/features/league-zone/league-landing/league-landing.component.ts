import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  LEAGUE_ADMINS_PATH,
  LEAGUE_HALL_OF_FAME_PATH,
} from '@pdz/core/route-paths';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { getLeagueLogoUrl } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';

const STATUS: Record<
  League.TournamentSummary['phase'],
  { label: string; tone: ChipTone }
> = {
  upcoming: { label: 'Upcoming', tone: 'info' },
  drafting: { label: 'Drafting', tone: 'info' },
  season: { label: 'In Season', tone: 'success' },
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
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    TeamLogoComponent,
  ],
})
export class LeagueLandingComponent {
  readonly getLogoUrl = getLeagueLogoUrl;
  readonly adminsPath = LEAGUE_ADMINS_PATH;
  readonly hallOfFamePath = LEAGUE_HALL_OF_FAME_PATH;

  readonly league = toSignal(
    inject(LeagueZoneService)
      .getLeague()
      .pipe(catchError(() => of(null))),
  );

  readonly tournaments = computed(() =>
    (this.league()?.tournaments ?? []).map((tournament) => ({
      tournament,
      status: STATUS[tournament.phase] ?? STATUS.upcoming,
      over: tournament.phase === 'completed',
      signUpOpen: tournament.signUpOpen,
    })),
  );

  readonly showHallOfFame = computed(
    () => (this.league()?.tournaments ?? []).length > 0,
  );
}
