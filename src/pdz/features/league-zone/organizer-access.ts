import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@pdz/core/services/auth0.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { LeagueManageService } from './league-manage/league-manage.service';
import { LeagueZoneService } from './league-zone.service';

export function injectIsOrganizer(): Signal<boolean> {
  const auth = inject(AuthService);
  const manage = inject(LeagueManageService);
  const league = inject(LeagueZoneService);

  return toSignal(
    auth.isAuthenticated$.pipe(
      switchMap((signedIn) => {
        const leagueSlug = league.leagueSlug();
        const tournamentSlug = league.tournamentSlug();
        if (!signedIn || !leagueSlug || !tournamentSlug) return of(false);
        return manage.canManage(leagueSlug, tournamentSlug).pipe(
          map((roles) => roles.includes('organizer')),
          catchError(() => of(false)),
        );
      }),
    ),
    { initialValue: false },
  );
}
