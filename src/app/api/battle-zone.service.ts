import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TierPokemon } from '../battle-zone/tier-list';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class BattleZoneService {
  constructor(private apiService: ApiService) {}

  signUp(signupData: object) {
    return this.apiService.post(`battlezone/pdbl/signup`, false, signupData);
  }

  getTiers(): Observable<
    {
      name: string;
      pokemon: TierPokemon[];
    }[]
  > {
    return this.apiService.get(`battlezone/pdbl/tiers`, false);
  }

  getDetails(): Observable<{
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
    prize: number;
  }> {
    return this.apiService.get(`battlezone/pdbl`, false);
  }
}
