import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import {
  DELETION_PATH,
  PRIVACY_PATH,
  SETTINGS_PATH,
  TERMS_PATH,
} from '@pdz/core/route-paths';
import { RoleService } from '@pdz/core/services/role.service';
import { map, take } from 'rxjs';

const ALLOWED = [
  `/${SETTINGS_PATH}/${DELETION_PATH}`,
  `/${PRIVACY_PATH}`,
  `/${TERMS_PATH}`,
];

export const deletionGuard: CanActivateChildFn = (_route, state) => {
  const roleService = inject(RoleService);
  const router = inject(Router);
  const path = state.url.split(/[?#]/)[0].replace(/\/+$/, '');

  return roleService.me$.pipe(
    take(1),
    map((me) =>
      me?.deletionScheduledFor && !ALLOWED.includes(path)
        ? router.createUrlTree(['/', SETTINGS_PATH, DELETION_PATH])
        : true,
    ),
  );
};
