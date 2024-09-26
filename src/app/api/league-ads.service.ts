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
}

interface Division {
  divisionName: string;
  skillLevelRange: {
    from: number;
    to: number;
  };
  cashValue: number;
  platform: 'Pokémon Showdown' | 'Scarlet/Violet';
  format: 'Singles' | 'VGC' | 'Other';
  description?: string;
}

export interface LeagueAd {
  leagueName: string;
  organizer: string;
  description: string;
  recruitmentStatus: 'Open' | 'Closed' | 'Full' | 'Canceled';
  hostPlatform: 'Discord' | 'Battlefy';
  serverLink?: string;
  divisions: Division[];
  signupLink: string;
  closesAt: Date;
  seasonStart: Date;
  seasonEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
