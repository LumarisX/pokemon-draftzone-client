import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MatchupService {

  constructor(private apiService: ApiService) { }

  getSpeedchart(matchupId: string) {
    return this.apiService.get(`/matchup/${matchupId}/speedchart`)
  }

  getSummery(matchupId: string) {
    return this.apiService.get(`/matchup/${matchupId}/summery`)
  }

  getTypechart(matchupId: string) {
    return this.apiService.get(`/matchup/${matchupId}/typechart`)
  }

  getMovechart(matchupId: string) {
    return this.apiService.get(`/matchup/${matchupId}/movechart`)
  }

  getCoveragechart(matchupId: string) {
    return this.apiService.get(`/matchup/${matchupId}/coveragechart`)
  }
}