import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { RoleService } from '@pdz/core/services/role.service';

export const adminGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  return roleService.isAdmin$.pipe(
    take(1),
    map((isAdmin) => (isAdmin ? true : router.createUrlTree(['/']))),
  );
};
