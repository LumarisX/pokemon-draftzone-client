import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth0.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  constructor(private apiService: ApiService, private auth: AuthService) {}

  getDraftsList() {
    return this.apiService.get('draft/teams');
  }

  getDraft(teamName: string) {
    return this.apiService.get(`draft/${teamName}`);
  }

  newDraft(draftData: any) {
    return this.apiService.post(`draft/teams`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`draft/${teamName}/matchups`);
  }

  newMatchup(teamName: string, matchupData: any) {
    return this.apiService.post(`draft/${teamName}/matchups`, matchupData);
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }
}
