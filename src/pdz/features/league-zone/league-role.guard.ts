import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LeagueRole } from '@pdz/core/services/auth0.service';
import { catchError, map, of, take } from 'rxjs';
import { LeagueManageService } from './league-manage/league-manage.service';

export const leagueRoleGuard: CanActivateFn = (route) => {
  const leagueManageService = inject(LeagueManageService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as LeagueRole | undefined;
  const leagueSlug = route.paramMap.get('leagueSlug');
  const tournamentSlug = route.paramMap.get('tournamentSlug');

  if (!requiredRole || !leagueSlug || !tournamentSlug) {
    return router.createUrlTree(['/']);
  }

  const fallback = router.createUrlTree([
    '/',
    LEAGUE_ZONE_PATH,
    leagueSlug,
    'tournaments',
    tournamentSlug,
  ]);

  return leagueManageService.canManage(leagueSlug, tournamentSlug).pipe(
    take(1),
    map((roles) => (roles.includes(requiredRole) ? true : fallback)),
    catchError(() => of(fallback)),
  );
};
