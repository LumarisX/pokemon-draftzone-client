import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError, take } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { OwnershipService } from '../services/ownership.service';

@Injectable({
  providedIn: 'root',
})
export class OwnerGuard implements CanActivate {
  private ownershipService = inject(OwnershipService);
  private auth = inject(AuthService);
  private router = inject(Router);


  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const teamId = route.paramMap.get('teamid');
    const matchupId = route.queryParamMap.get('id');

    if (!matchupId) {
      console.error('OwnerGuard: Matchup ID query parameter is required.');
      return this.router.createUrlTree(['/']);
    }

    if (!teamId) {
      console.error('OwnerGuard: Team ID route parameter is required.');
      return this.router.createUrlTree(['/']);
    }

    return this.auth.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user || !user.sub) {
          console.error('OwnerGuard: User not authenticated.');
          return of(this.router.createUrlTree(['/login']));
        }
        const userId = user.sub;
        return this.ownershipService
          .checkMatchupOwnership(userId, matchupId)
          .pipe(
            map((isOwner) => {
              if (isOwner) {
                return true;
              } else {
                console.log(
                  `User not owner of matchup ${matchupId}. Redirecting to shared view.`,
                );
                return this.router.createUrlTree(['/matchup', matchupId]);
              }
            }),
            catchError((error) => {
              console.error('Error checking ownership:', error);
              return of(this.router.createUrlTree(['/matchup', matchupId]));
            }),
          );
      }),
      catchError((error) => {
        console.error('OwnerGuard: Error retrieving user:', error);
        return of(this.router.createUrlTree(['/login']));
      }),
    );
  }
}
