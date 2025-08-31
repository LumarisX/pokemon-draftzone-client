import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

const ROOTPATH = 'leagues';

@Injectable({
  providedIn: 'root',
})
export class LeagueAdsService {
  private apiService = inject(ApiService);


  getLeagueAds(): Observable<LeagueAd[]> {
    return this.apiService.get(ROOTPATH, false);
  }

  newAd(data: Object) {
    return this.apiService.post([ROOTPATH, 'manage'], true, data);
  }

  getMyAds(): Observable<LeagueAd[]> {
    return this.apiService.get([ROOTPATH, 'manage'], true);
  }

  deleteAd(_id: string) {
    return this.apiService.delete([ROOTPATH, _id]);
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
