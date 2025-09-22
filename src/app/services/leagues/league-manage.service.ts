import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { LeagueZoneService } from './league-zone.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueManageService {
  private apiService = inject(ApiService);
  leagueZoneService = inject(LeagueZoneService);

  setPick(
    leagueId: string,
    pick: {
      teamId: string;
      pokemonId: string;
      pickNumber: number;
      divisionId: string;
    },
  ) {
    return this.apiService.post(`leagues/${leagueId}/setdraft`, true, pick);
  }

  canManage(leagueKey: string) {
    return this.apiService.get<string[]>(`leagues/${leagueKey}/roles`, true);
  }

  setDivisionState(state: string) {
    return this.apiService.post<string[]>(
      `leagues/${this.leagueZoneService.leagueKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/state`,
      true,
      { state },
    );
  }
}
