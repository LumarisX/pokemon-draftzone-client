import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'pdz-tournament-pools',
  templateUrl: './tournament-pools.component.html',
  styleUrl: './tournament-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CardComponent,
    EmptyStateComponent,
    LoadingComponent,
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
}
