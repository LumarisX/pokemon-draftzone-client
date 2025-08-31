import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatchupService } from './matchup.service';

@Injectable({
  providedIn: 'root',
})
export class OwnershipService {
  private matchupService = inject(MatchupService);


  /**
   * Checks if the given user owns the specified matchup.
   * @param userId The ID of the user trying to access the resource.
   * @param matchupId The matchup ID from the query params.
   * @returns Observable<boolean> indicating ownership status.
   */
  checkMatchupOwnership(
    userId: string,
    matchupId: string,
  ): Observable<boolean> {
    return this.matchupService
      .getMatchupOwnership(userId, matchupId)
      .pipe(map((response) => response.isOwner));
  }
}
