import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@pdz/core/services/api.service';

const ROOTPATH = 'external/tournament-ads';
const HOSTED_ROOTPATH = 'hosted/tournament-ads';

@Injectable({
  providedIn: 'root',
})
export class LeagueAdsService {
  private apiService = inject(ApiService);

  getLeagueAds(): Observable<LeagueAd[]> {
    return this.apiService.get([ROOTPATH]);
  }

  getHostedLeagueAds(): Observable<LeagueAd[]> {
    return this.apiService.get([HOSTED_ROOTPATH]);
  }

  newAd(data: Object) {
    return this.apiService.post([ROOTPATH], data, {
      authenticated: true,
      invalidateCache: [[ROOTPATH]],
    });
  }

  getMyAds(): Observable<LeagueAd[]> {
    return this.apiService.get([ROOTPATH, 'me'], {
      authenticated: true,
    });
  }

  deleteAd(_id: string) {
    return this.apiService.delete([ROOTPATH, _id], {
      invalidateCache: [[ROOTPATH]],
    });
  }
  //Currently Unused
  getUnreadCount(counts: { [key: string]: number }) {
    return this.apiService.get<{ [key: string]: number }>(
      [ROOTPATH, 'unread'],
      {
        params: counts,
      },
    );
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
  hosted?: boolean;
}
