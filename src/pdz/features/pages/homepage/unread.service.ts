import { Injectable, signal } from '@angular/core';
import { safeStorage } from '@pdz/core/utils/storage';
import { CHANGELOG } from '@pdz/features/pages/homepage/changelog-core/changelog.data';
import { NEWS } from '@pdz/features/pages/homepage/news-core/news.data';

const NEWS_KEY = 'newsTime';
const LEAGUE_KEY = 'leagueTime';

function capCount(value: number): string {
  if (value > 9) return '9+';
  if (value > 0) return value.toString();
  return '';
}

@Injectable({
  providedIn: 'root',
})
export class UnreadService {
  private readonly news = signal(this.unreadNews());
  private readonly leagues = signal('');

  readonly newsCount = this.news.asReadonly();
  readonly leagueCount = this.leagues.asReadonly();

  markNewsRead(): void {
    safeStorage.set(NEWS_KEY, Date.now().toString());
    this.news.set('');
  }

  markLeaguesRead(): void {
    safeStorage.set(LEAGUE_KEY, Date.now().toString());
    this.leagues.set('');
  }

  private unreadNews(): string {
    const lastRead = +(safeStorage.get(NEWS_KEY) || 0);
    const unread = [...NEWS, ...CHANGELOG].filter(
      (entry) => new Date(entry.date).getTime() > lastRead,
    ).length;
    return capCount(unread);
  }
}
