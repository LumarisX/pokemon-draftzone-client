import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueManageService {
  private apiService = inject(ApiService);

  setPick(leagueId: string, pick: { coach: string; pokemonId: string }) {
    return this.apiService.get(`league/${leagueId}/setdraft`, true, pick);
  }
}
