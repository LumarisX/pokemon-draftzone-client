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
    return this.apiService.post(`leagues/manage`, true, data);
  }

  getMyAds(): Observable<LeagueAd[]> {
    return this.apiService.get(`leagues/manage`, true);
  }

  deleteAd(_id: string) {
    return this.apiService.delete(`leagues/${_id}`);
  }
}

interface Division {
  divisionName: string;
  ruleset: string;
  skillLevels: number[];
  prizeValue: number;
  platform: 'Pokémon Showdown' | 'Scarlet/Violet';
  format: string;
  description?: string;
}

export interface LeagueAd {
  _id: string;
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
  status: 'Pending' | 'Approved' | 'Denied';
  createdAt: string;
  tags: string[];
}
