import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class MatchupService {
  constructor(private apiService: ApiService) {}

  getMatchup(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}`, true);
  }

  getQuickMatchup(matchupData: object) {
    return this.apiService.post(`matchup/quick`, false, matchupData);
  }

  getSharedMatchup(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}`, false);
  }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/speedchart`, true);
  }

  getsummary(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/summary`, true);
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/typechart`, true);
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/movechart`, true);
  }

  getCoveragechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/coveragechart`, true);
  }
}
