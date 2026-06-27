import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { RoleService } from '@pdz/core/services/role.service';

/**
 * Allows the route only for users with the `admin` (or `owner`) role.
 * This is a UX gate — the server enforces the same check on every admin API.
 */
export const adminGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  return roleService.isAdmin$.pipe(
    take(1),
    map((isAdmin) => (isAdmin ? true : router.createUrlTree(['/']))),
  );
};
