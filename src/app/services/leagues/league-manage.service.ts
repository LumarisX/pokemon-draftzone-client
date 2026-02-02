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
    tournamentId: string,
    pick: {
      teamId: string;
      pokemonId: string;
      pickNumber: number;
      divisionId: string;
    },
  ) {
    return this.apiService.post(
      `leagues/${tournamentId}/manage/divisions/${this.leagueZoneService.divisionKey()}/setdraft`,
      true,
      pick,
    );
  }

  canManage(tournamentKey: string) {
    return this.apiService.get<string[]>(
      `leagues/${tournamentKey}/roles`,
      true,
    );
  }

  setDivisionState(state: string) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/state`,
      true,
      { state },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/skip`,
      true,
      '',
    );
  }
}
