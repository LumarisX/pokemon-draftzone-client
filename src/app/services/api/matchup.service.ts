import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class MatchupService {
  constructor(private apiService: ApiService) {}

  getMatchup(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}`);
  }

  getSharedMatchup(matchupId: string) {
    return this.apiService.getUnauth(`matchup/${matchupId}`);
  }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/speedchart`);
  }

  getsummary(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/summary`);
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/typechart`);
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/movechart`);
  }

  getCoveragechart(matchupId: string) {
    return this.apiService.get(`matchup/${matchupId}/coveragechart`);
  }
}
