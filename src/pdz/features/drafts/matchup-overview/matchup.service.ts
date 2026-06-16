import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { MatchupData } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { Observable, of } from 'rxjs';
import { QuickFormData } from '@pdz/features/tools/quick-matchup/form/quick-matchup-form.component';

export const matchupPath = 'matchup';

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

  getSharedMatchup(matchupId: string) {
    return this.apiService.get<MatchupData>(
      `${matchupPath}/${matchupId}/shared`,
    );
  }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/speedchart`, {
      authenticated: true,
    });
  }

  getsummary(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/summary`, {
      authenticated: true,
    });
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/typechart`, {
      authenticated: true,
    });
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/movechart`, {
      authenticated: true,
    });
  }

  getCoveragechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/coveragechart`, {
      authenticated: true,
    });
  }

  getMatchupOwnership(userId: string, matchupId: string) {
    return this.apiService.get<{ isOwner: boolean }>(
      `${matchupPath}/${matchupId}/check-ownership`,
      { params: { userId } },
    );
  }

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
