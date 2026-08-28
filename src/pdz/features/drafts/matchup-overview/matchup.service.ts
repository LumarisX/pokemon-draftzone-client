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

  getMatchup(
    matchupId: string,
    options: { suppressErrorReporting?: boolean } = {},
  ) {
    return this.apiService.get<MatchupData>(`${matchupPath}/${matchupId}`, {
      errorHandlingOptions: {
        suppressErrorReporting: options.suppressErrorReporting ?? false,
      },
    });
  }

  getLeagueMatchup(
    leagueSlug: string,
    tournamentSlug: string,
    matchupSlug: string,
  ) {
    return this.apiService.get<MatchupData>(
      `leagues/${leagueSlug}/tournaments/${tournamentSlug}/matchups/${matchupSlug}/analysis`,
    );
  }

  getQuickMatchup(matchupData: QuickFormData): Observable<MatchupData> {
    return this.apiService.post(`${matchupPath}/quick`, matchupData);
  }

  //Currently Unused
  getSpeedchart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/speedchart`);
  }

  //Currently Unused
  getsummary(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/summary`);
  }

  //Currently Unused
  getTypechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/typechart`);
  }

  //Currently Unused
  getMovechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/movechart`);
  }

  //Currently Unused
  getCoveragechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/coveragechart`);
  }

  getMatchupOwnership(matchupId: string) {
    return this.apiService.get<{ isOwner: boolean }>(
      `${matchupPath}/${matchupId}/check-ownership`,
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
        invalidateCache: [`${matchupPath}/${matchupId}`],
      },
    );
  }
}
