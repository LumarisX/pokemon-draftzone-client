import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueAdsService {
  constructor(private apiService: ApiService) {}

  getLeagueAds(): Observable<LeagueAd[]> {
    return this.apiService.get(`leagues`, false);
  }

  newAd(data: Object) {
    return this.apiService.post(`leagues`, data);
  }
}

interface Division {
  divisionName: string;
  ruleset: string;
  skillLevelRange: {
    from: number;
    to: number;
  };
  prizeValue?: number;
  platform: 'Pokémon Showdown' | 'Scarlet/Violet';
  format: string;
  description?: string;
}

export interface LeagueAd {
  leagueName: string;
  organizer: string;
  description: string;
  recruitmentStatus: 'Open' | 'Closed' | 'Full' | 'Canceled';
  hostLink?: string;
  divisions: Division[];
  signupLink: string;
  closesAt: string;
  seasonStart?: string;
  seasonEnd?: string;
  createdAt: string;
  updatedAt: string;
}
