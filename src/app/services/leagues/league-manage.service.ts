import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueManageService {
  private apiService = inject(ApiService);

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
}
