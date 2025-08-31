import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { MatchupData } from '../drafts/matchup-overview/matchup-interface';
import { QuickFormData } from '../tools/quick-matchup/form/quick-matchup-form.component';
import { Observable } from 'rxjs';

export const matchupPath = 'matchup';

@Injectable({
  providedIn: 'root',
})
export class MatchupService {
  private apiService = inject(ApiService);


  getMatchup(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}`, true);
  }

  getQuickMatchup(matchupData: QuickFormData): Observable<MatchupData> {
    return this.apiService.post(`${matchupPath}/quick`, false, matchupData);
  }

  getSharedMatchup(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}`, false);
  }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/speedchart`, true);
  }

  getsummary(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/summary`, true);
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/typechart`, true);
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`${matchupPath}/${matchupId}/movechart`, true);
  }

  getCoveragechart(matchupId: string) {
    return this.apiService.get(
      `${matchupPath}/${matchupId}/coveragechart`,
      true,
    );
  }

  getMatchupOwnership(userId: string, matchupId: string) {
    return this.apiService.get<{ isOwner: boolean }>(
      `${matchupPath}/${matchupId}/check-ownership`,
      false,
      { userId },
    );
  }
}
