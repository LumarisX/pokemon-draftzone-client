import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';
import { waitingMessage } from '@pdz/features/league-zone/tournament-milestones';

@Component({
  selector: 'pdz-tournament-pools',
  templateUrl: './tournament-pools.component.html',
  styleUrl: './tournament-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CardComponent,
    EmptyStateComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class TournamentPoolsComponent {
  readonly leagueInfo = toSignal(
    inject(LeagueZoneService)
      .getLeagueInfo()
      .pipe(catchError(() => of(null))),
  );

  readonly noPoolsMessage = computed(() =>
    waitingMessage(
      'The organizers set up pools before the draft.',
      this.leagueInfo(),
    ),
  );
}
