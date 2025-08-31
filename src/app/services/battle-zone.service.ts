import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TierPokemon } from '../battle-zone/tier-list';
import { ApiService } from './api.service';
export type LeagueTier = {
  name: string;
  pokemon: TierPokemon[];
};

export type LeagueTierGroup = {
  label?: string;
  tiers: LeagueTier[];
};

@Injectable({
  providedIn: 'root',
})
export class BattleZoneService {
  private apiService = inject(ApiService);


  signUp(signupData: object) {
    return this.apiService.post(`battlezone/pdbl/signup`, true, signupData);
  }

  getTiers(): Observable<LeagueTierGroup[]> {
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
