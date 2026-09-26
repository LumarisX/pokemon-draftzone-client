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

  getLeagueMatchup(tournamentSlug: string, matchupSlug: string) {
    return this.apiService.get<MatchupData>(
      `tournaments/${tournamentSlug}/matchups/${matchupSlug}/analysis`,
    );
  }

  getQuickMatchup(matchupData: QuickFormData): Observable<MatchupData> {
    return this.apiService.post(`${matchupPath}/quick`, matchupData);
  }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/speedchart`);
  }

  getsummary(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/summary`);
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/typechart`);
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/movechart`);
  }

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
      const path = `tournaments/${target.tournamentSlug}/matchups/${target.matchupSlug}`;
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
