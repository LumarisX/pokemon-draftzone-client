import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { MatchupData } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { Observable, of } from 'rxjs';
import { QuickFormData } from '@pdz/features/tools/quick-matchup/form/quick-matchup-form.component';

export const matchupPath = 'external/matchups';

@Injectable({
  providedIn: 'root',
})
export class MatchupService {
  private apiService = inject(ApiService);

  getMatchup(matchupId: string) {
    return this.apiService.get<MatchupData>(`${matchupPath}/${matchupId}`, {
      authenticated: true,
      errorHandlingOptions: { suppressErrorReporting: true },
    });
  }

  getQuickMatchup(matchupData: QuickFormData): Observable<MatchupData> {
    return this.apiService.post(`${matchupPath}/quick`, matchupData);
  }

  // TODO: no server route exists for this yet (ExternalMatchupBreakdownController
  // only has POST quick / GET :matchupId). This call 404s until a "shared"
  // endpoint is added server-side.
  getSharedMatchup(matchupId: string) {
    return this.apiService.get<MatchupData>(
      `${matchupPath}/${matchupId}/shared`,
    );
  }

  //Currently Unused
  getSpeedchart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/speedchart`, {
      authenticated: true,
    });
  }

  //Currently Unused
  getsummary(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/summary`, {
      authenticated: true,
    });
  }

  //Currently Unused
  getTypechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/typechart`, {
      authenticated: true,
    });
  }

  //Currently Unused
  getMovechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/movechart`, {
      authenticated: true,
    });
  }

  //Currently Unused
  getCoveragechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/coveragechart`, {
      authenticated: true,
    });
  }

  // TODO: no "check-ownership" route exists server-side. OwnerGuard relies on
  // this 404ing safely (catchError redirects to the shared view), but real
  // owners can never reach the edit view until this endpoint is added.
  getMatchupOwnership(userId: string, matchupId: string) {
    return this.apiService.get<{ isOwner: boolean }>(
      `${matchupPath}/${matchupId}/check-ownership`,
      { params: { userId } },
    );
  }

  // TODO: no "update-notes" route exists server-side yet, so this 404s.
  // The underlying ExternalMatchup schema already has a `notes` field —
  // this just needs a controller route + service method wired up.
  updateNotes(matchupId: string, notes: string) {
    const payload = notes.trim();
    if (!payload) {
      return of({ success: true, message: 'No notes to save' });
    }
    console.log(matchupId);
    return this.apiService.post(
      `${matchupPath}/${matchupId}/update-notes`,
      { notes: payload },
      {
        authenticated: true,
        invalidateCache: [`${matchupPath}/${matchupId}/notes`],
      },
    );
  }
}
