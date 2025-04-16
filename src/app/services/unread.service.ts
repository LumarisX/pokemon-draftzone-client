import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class UnreadService {
  leagueCount = new BehaviorSubject<string>('');

  constructor(private api: ApiService) {
    const lastLeagueTime = +(localStorage.getItem('leagueTime') || 0);
    const lastNewsTime = +(localStorage.getItem('newsTime') || 0);
    this.getUnreadCount({
      leagueAd: lastLeagueTime,
      news: lastNewsTime,
    }).subscribe((count) => {
      console.log(count);
      // if (+count > 9) {
      //   this.leagueCount.next('9+');
      // } else if (+count > 0) {
      //   this.leagueCount.next(count);
      // } else {
      //   this.leagueCount.next('');
      // }
    });
  }

  getUnreadCount(counts: { [key: string]: number }) {
    return this.api.get<typeof counts>(
      ['data', 'unread-counts'],
      false,
      counts,
    );
  }
}
