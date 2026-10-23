import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';

export type StartTournamentData = { slug: string; name: string };

type LeagueChoice = { name: string; leagueSlug: string; logo?: string };

@Component({
  selector: 'pdz-start-tournament-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, EmptyStateComponent, RouterLink, SkeletonLayoutComponent, TeamLogoComponent],
  template: `
    @let leagues = choices();
    @if (leagues === undefined) {
      <pdz-skeleton-layout layout="list" [count]="3" />
    } @else if (leagues === null) {
      <pdz-empty-state
        size="sm"
        kind="error"
        heading="Your leagues didn't load"
        message="The list of leagues you run didn't come back."
      />
    } @else if (leagues.length) {
      <p class="start__intro">
        The new tournament gets its own copy of {{ data.name }}, so later edits to this
        list won't change it.
      </p>
      <ul class="start__list">
        @for (league of leagues; track league.leagueSlug) {
          <li>
            <button class="start__league" type="button" (click)="choose(league)">
              <pdz-team-logo size="sm" decorative [src]="league.logo" [name]="league.name" />
              <span class="start__name">{{ league.name }}</span>
            </button>
          </li>
        }
      </ul>
    } @else {
      <pdz-empty-state
        size="sm"
        kind="empty"
        heading="No league to host it in"
        message="Tournaments run inside a league. Create one first."
      />
      <div class="pdz-dialog-actions">
        <a pdz-button [routerLink]="['/', leagueZone, 'new']" (click)="ref.close()">
          Create a League
        </a>
      </div>
    }
  `,
  styleUrl: './start-tournament-dialog.component.scss',
})
export class StartTournamentDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<void>;
  protected readonly data = inject<StartTournamentData>(DIALOG_DATA);
  private readonly leagues = inject(LeagueZoneService);
  private readonly router = inject(Router);

  protected readonly leagueZone = LEAGUE_ZONE_PATH;

  protected readonly choices = toSignal(
    this.leagues.getOwnedLeagues().pipe(
      map((owned) =>
        owned.leagues.filter((league) => league.canCreateTournament) as LeagueChoice[],
      ),
      catchError(() => of(null)),
    ),
    { initialValue: undefined },
  );

  protected choose(league: LeagueChoice): void {
    this.ref.close();
    this.router.navigate(
      ['/', LEAGUE_ZONE_PATH, league.leagueSlug, 'tournaments', 'new'],
      { queryParams: { tierList: this.data.slug } },
    );
  }
}
