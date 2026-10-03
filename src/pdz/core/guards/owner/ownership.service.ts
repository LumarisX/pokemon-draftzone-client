import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatchupService } from '@pdz/features/drafts/matchup-overview/matchup.service';

@Injectable({
  providedIn: 'root',
})
export class OwnershipService {
  private matchupService = inject(MatchupService);

  checkMatchupOwnership(matchupId: string): Observable<boolean> {
    return this.matchupService
      .getMatchupOwnership(matchupId)
      .pipe(map((response) => response.isOwner));
  }
}
