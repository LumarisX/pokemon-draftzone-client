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

  // Shared (anonymous) view hits the same route as getMatchup, but without
  // authentication. The server route is @OptionalAuth, so analyze(sub) runs
  // with no sub and returns the unflipped matchup payload.
  getSharedMatchup(matchupId: string) {
    return this.apiService.get<MatchupData>(`${matchupPath}/${matchupId}`);
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

  getMatchupOwnership(matchupId: string) {
    return this.apiService.get<{ isOwner: boolean }>(
      `${matchupPath}/${matchupId}/check-ownership`,
      { authenticated: true },
    );
  }

  updateNotes(matchupId: string, notes: string) {
    const payload = notes.trim();
    if (!payload) {
      return of({ success: true, message: 'No notes to save' });
    }
    return this.apiService.post(
      `${matchupPath}/${matchupId}/update-notes`,
      { notes: payload },
      {
        authenticated: true,
        invalidateCache: [`${matchupPath}/${matchupId}`],
      },
    );
  }
}
