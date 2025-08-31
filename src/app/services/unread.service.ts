import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class UnreadService {
  private api = inject(ApiService);

  leagueCount = new BehaviorSubject<string>('');
  newsCount = new BehaviorSubject<string>('');

  constructor() {
    const lastLeagueTime = +(localStorage.getItem('leagueTime') || 0);
    const lastNewsTime = +(localStorage.getItem('newsTime') || 0);
    this.getUnreadCount({
      leagueAd: lastLeagueTime,
      news: lastNewsTime,
    }).subscribe((count) => {
      this.leagueCount.next(this.capNumber(count['leagueAd']));
      this.newsCount.next(this.capNumber(count['news']));
    });
  }

  getUnreadCount(counts: { [key: string]: number }) {
    return this.api.get<typeof counts>(
      ['data', 'unread-counts'],
      false,
      counts,
    );
  }

  private capNumber(value: number): string {
    if (value > 9) return '9+';
    if (value > 0) return value.toString();
    return '';
  }
}
