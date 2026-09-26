import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map, Observable, of, take } from 'rxjs';
import { LeagueRole } from '@pdz/core/services/auth0.service';
import { LeagueManageService } from './league-manage/league-manage.service';

export const leagueRoleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): Observable<boolean> => {
  const leagueManageService = inject(LeagueManageService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as LeagueRole;
  if (!requiredRole) {
    console.error(
      'leagueRoleGuard: "role" data property is not defined for this route.',
    );
    return of(false);
  }

  const tournamentSlug = route.paramMap.get('tournamentSlug');
  if (!tournamentSlug) {
    console.error(
      'leagueRoleGuard: "tournamentSlug" parameter is not defined in the route.',
    );
    router.navigate(['/forbidden']);
    return of(false);
  }

  return leagueManageService.canManage(tournamentSlug).pipe(
    take(1),
    map((roles) => {
      if (roles.includes(requiredRole)) return true;
      console.warn(
        `Access denied: User does not have the required role '${requiredRole}' for tournament '${tournamentSlug}'.`,
      );
      router.navigate(['/forbidden']);
      return false;
    }),
  );
};
