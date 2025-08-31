import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { map, Observable, take } from 'rxjs';
import { AuthService, LeagueRole } from '../services/auth0.service';

/**
 * A Router Guard to check if the user has a specific role for a league before allowing access to a route.
 * This is a function-based guard, which is the modern approach in Angular.
 *
 * @param route The activated route snapshot containing route parameters and data.
 * @returns An observable that emits `true` to allow navigation, or `false` to block it.
 */
export const leagueRoleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('HEY IM HERE');
  const requiredRole = route.data['role'] as LeagueRole;
  if (!requiredRole) {
    console.error(
      'leagueRoleGuard: "role" data property is not defined for this route.',
    );
    return new Observable<boolean>((subscriber) => {
      subscriber.next(false);
      subscriber.complete();
    });
  }

  const leagueId = route.paramMap.get('leagueId');
  if (!leagueId) {
    console.error(
      'leagueRoleGuard: "leagueId" parameter is not defined in the route.',
    );
    router.navigate(['/forbidden']);
    return new Observable<boolean>((subscriber) => {
      subscriber.next(false);
      subscriber.complete();
    });
  }

  return authService.getLeagueRoles().pipe(
    take(1),
    map((roles) => {
      if (roles[leagueId] === requiredRole) {
        return true;
      }
      console.warn(
        `Access denied: User does not have the required role '${requiredRole}' for league '${leagueId}'.`,
      );
      router.navigate(['/forbidden']);
      return false;
    }),
  );
};
