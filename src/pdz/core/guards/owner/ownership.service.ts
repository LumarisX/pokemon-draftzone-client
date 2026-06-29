import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatchupService } from '@pdz/features/drafts/matchup-overview/matchup.service';

@Injectable({
  providedIn: 'root',
})
export class OwnershipService {
  private matchupService = inject(MatchupService);

  /**
   * Checks if the current authenticated user owns the specified matchup.
   * @param matchupId The matchup ID from the query params.
   * @returns Observable<boolean> indicating ownership status.
   */
  checkMatchupOwnership(matchupId: string): Observable<boolean> {
    return this.matchupService
      .getMatchupOwnership(matchupId)
      .pipe(map((response) => response.isOwner));
  }
}
