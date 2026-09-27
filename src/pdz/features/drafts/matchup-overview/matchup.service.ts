import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { MatchupData } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { Observable } from 'rxjs';
import { QuickFormData } from '@pdz/features/tools/quick-matchup/form/quick-matchup-form.component';

export const matchupPath = 'external/matchups';

export type MatchupNotesTarget =
  | { source: 'draft'; matchupId: string }
  | {
      source: 'league';
      leagueSlug: string;
      tournamentSlug: string;
      matchupSlug: string;
    };

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

  saveNotes(target: MatchupNotesTarget, notes: string) {
    const payload = { notes: notes.trim() };
    if (target.source === 'league') {
      const path = `leagues/${target.leagueSlug}/tournaments/${target.tournamentSlug}/matchups/${target.matchupSlug}`;
      return this.apiService.post(`${path}/notes`, payload, {
        invalidateCache: [`${path}/analysis`],
      });
    }
    return this.apiService.post(
      `${matchupPath}/${target.matchupId}/notes`,
      payload,
      {
        invalidateCache: [`${matchupPath}/${target.matchupId}`],
      },
    );
  }
}
