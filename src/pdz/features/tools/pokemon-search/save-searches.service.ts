import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SavedSearch {
  params: string;
  href: string;
  savedAt: string;
}

const STORAGE_KEY = 'pdz-saved-searches';

@Injectable({ providedIn: 'root' })
export class SaveSearchesServices {
  private readonly _changed$ = new Subject<void>();
  readonly changed$ = this._changed$.asObservable();

  getSavedSearches(): SavedSearch[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
    } catch {
      return [];
    }
  }

  isBookmarked(params: string): boolean {
    return !!params && this.getSavedSearches().some((s) => s.params === params);
  }

  /** Adds or removes a bookmark. Returns true if now bookmarked. */
  toggle(params: string, href: string): boolean {
    const saved = this.getSavedSearches();
    const idx = saved.findIndex((s) => s.params === params);
    if (idx >= 0) {
      saved.splice(idx, 1);
      this.persist(saved);
      return false;
    }
    saved.push({ params, href, savedAt: new Date().toISOString() });
    this.persist(saved);
    return true;
  }

  remove(params: string): void {
    const saved = this.getSavedSearches().filter((s) => s.params !== params);
    this.persist(saved);
  }

  /** Normalises URL search params into a stable comparison key. */
  static getSearchKey(): string {
    const params = new URLSearchParams(window.location.search);
    const entries = [...params.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return new URLSearchParams(entries).toString();
  }

  private persist(saved: SavedSearch[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    this._changed$.next();
  }
}
