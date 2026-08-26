import { Injectable, signal } from '@angular/core';
import { ReplayAnalysis } from './replay.interface';

const STORAGE_KEY = 'pdz.replayAnalyzer.history';
const MAX_ENTRIES = 500;
const MAX_CACHED_ANALYSES = 10;

export type ReplayHistoryEntry = {
  uri: string;
  id: string;
  players: string[];
  score: number[];
  analyzedAt: number;
};

export function replayIdFromURI(uri: string): string {
  const trimmed = uri.trim();
  const withoutQuery = trimmed.split(/[?#]/)[0].replace(/\/+$/, '');
  const segment = withoutQuery.split('/').pop() ?? '';
  return segment.replace(/\.(json|log)$/i, '') || trimmed;
}

@Injectable({ providedIn: 'root' })
export class ReplayHistoryService {
  private readonly store = signal<ReplayHistoryEntry[]>(read());
  private readonly analyses = new Map<string, ReplayAnalysis>();

  readonly entries = this.store.asReadonly();

  cached(uri: string): ReplayAnalysis | undefined {
    const key = uri.trim();
    const analysis = this.analyses.get(key);
    if (!analysis) {
      return undefined;
    }
    this.analyses.delete(key);
    this.analyses.set(key, analysis);
    return analysis;
  }

  record(uri: string, analysis: ReplayAnalysis): void {
    const entry: ReplayHistoryEntry = {
      uri: uri.trim(),
      id: replayIdFromURI(uri),
      players: analysis.players.map((player) => player.username),
      score: analysis.players.map((player) => player.total.kills),
      analyzedAt: Date.now(),
    };

    this.analyses.set(entry.uri, analysis);
    while (this.analyses.size > MAX_CACHED_ANALYSES) {
      const oldest = this.analyses.keys().next();
      if (oldest.done) {
        break;
      }
      this.analyses.delete(oldest.value);
    }

    this.commit([
      entry,
      ...this.store().filter((existing) => existing.id !== entry.id),
    ]);
  }

  remove(id: string): void {
    for (const entry of this.store()) {
      if (entry.id === id) {
        this.analyses.delete(entry.uri);
      }
    }
    this.commit(this.store().filter((entry) => entry.id !== id));
  }

  clear(): void {
    this.analyses.clear();
    this.commit([]);
  }

  private commit(entries: ReplayHistoryEntry[]): void {
    const capped = entries.slice(0, MAX_ENTRIES);
    this.store.set(capped);
    write(capped);
  }
}

function read(): ReplayHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function write(entries: ReplayHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    return;
  }
}

function isEntry(value: unknown): value is ReplayHistoryEntry {
  const entry = value as Partial<ReplayHistoryEntry> | null;
  return (
    !!entry &&
    typeof entry.uri === 'string' &&
    typeof entry.id === 'string' &&
    Array.isArray(entry.players) &&
    Array.isArray(entry.score)
  );
}
