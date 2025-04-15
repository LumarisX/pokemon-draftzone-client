import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

const ROOTPATH = 'leagues';

@Injectable({
  providedIn: 'root',
})
export class LeagueAdsService {
  newCount = new BehaviorSubject<string>('');
  time: number;

  constructor(private apiService: ApiService) {
    this.time = +(localStorage.getItem('leagueTime') || 0);
    this.getNewCount(this.time).subscribe((count) => {
      if (+count > 9) {
        this.newCount.next('9+');
      } else if (+count > 0) {
        this.newCount.next(count);
      } else {
        this.newCount.next('');
      }
    });
  }

  getLeagueAds(): Observable<LeagueAd[]> {
    localStorage.setItem('leagueTime', Date.now().toString());
    this.newCount.next('');
    return this.apiService.get(ROOTPATH, false);
  }

  getNewCount(time: number | string): Observable<string> {
    return this.apiService.get([ROOTPATH, 'count', time.toString()], false);
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
