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
    return this.apiService.get([ROOTPATH, 'ad-list'], false);
  }

  newAd(data: Object) {
    return this.apiService.post([ROOTPATH, 'ad-list/manage'], true, data, {
      invalidateCache: [[ROOTPATH, 'ad-list/manage']],
    });
  }

  getMyAds(): Observable<LeagueAd[]> {
    return this.apiService.get([ROOTPATH, 'ad-list/manage'], true);
  }

  deleteAd(_id: string) {
    return this.apiService.delete([ROOTPATH, 'ad-list', 'manage', _id], {
      invalidateCache: [[ROOTPATH, 'ad-list/manage']],
    });
  }
}

export interface LeagueAd {
  _id: string;
  leagueName: string;
  organizer: string;
  description: string;
  recruitmentStatus: 'Open' | 'Closed' | 'Full' | 'Canceled';
  leagueDoc?: string;
  serverLink?: string;
  rulesets: string[];
  skillLevels: number[];
  prizeValue: number;
  platforms: string[];
  formats: string[];
  signupLink: string;
  closesAt: string;
  seasonStart?: string;
  seasonEnd?: string;
  status: 'Pending' | 'Approved' | 'Denied';
  createdAt: string;
  tags: string[];
}
