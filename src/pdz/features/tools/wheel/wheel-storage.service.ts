import { Injectable } from '@angular/core';
import {
  clampRimArc,
  clampSpinSeconds,
  clampTurns,
  clampWeight,
  DEFAULT_OPTIONS,
  MAX_HISTORY,
  MAX_ITEMS,
  MAX_LABEL_LENGTH,
  MIN_WEIGHT,
  normalizeLabel,
  StoredWheelItem,
  WheelHistoryEntry,
  WheelOptions,
} from './wheel.model';

const ITEMS_KEY = 'pdz-wheel-items';
const OPTIONS_KEY = 'pdz-wheel-options';
const HISTORY_KEY = 'pdz-wheel-history';

@Injectable({ providedIn: 'root' })
export class WheelStorageService {
  loadItems(): StoredWheelItem[] | null {
    const raw = this.read(ITEMS_KEY);
    if (raw === null) return null;

    try {
      return this.normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  saveItems(items: StoredWheelItem[]): void {
    this.write(ITEMS_KEY, this.serialize(items));
  }

  loadOptions(): WheelOptions {
    const raw = this.read(OPTIONS_KEY);
    if (raw === null) return { ...DEFAULT_OPTIONS };

    try {
      const parsed = JSON.parse(raw) as Partial<WheelOptions>;
      const rimArc = Number(parsed?.rimArc);
      return {
        spinSeconds: clampSpinSeconds(
          Number(parsed?.spinSeconds ?? DEFAULT_OPTIONS.spinSeconds) ||
            DEFAULT_OPTIONS.spinSeconds,
        ),
        minTurns: clampTurns(
          Number(parsed?.minTurns ?? DEFAULT_OPTIONS.minTurns) ||
            DEFAULT_OPTIONS.minTurns,
        ),
        rimArc: clampRimArc(
          Number.isFinite(rimArc) ? rimArc : DEFAULT_OPTIONS.rimArc,
        ),
      };
    } catch {
      return { ...DEFAULT_OPTIONS };
    }
  }

  saveOptions(options: WheelOptions): void {
    this.write(OPTIONS_KEY, JSON.stringify(options));
  }

  loadHistory(): WheelHistoryEntry[] {
    const raw = this.read(HISTORY_KEY);
    if (raw === null) return [];

    try {
      return this.normalizeHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  saveHistory(history: WheelHistoryEntry[]): void {
    this.write(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  serialize(items: StoredWheelItem[]): string {
    return JSON.stringify(
      items.map(({ label, weight }) => ({ label, weight })),
      null,
      2,
    );
  }

  parse(text: string): StoredWheelItem[] {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('No usable items in that text.');

    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      data = null;
    }

    const source = Array.isArray(data) ? data : this.splitDelimited(trimmed);
    const items = this.normalize(source) ?? [];
    if (!items.length) throw new Error('No usable items in that text.');
    return items;
  }

  private splitDelimited(text: string): string[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;

    const single = lines[0] ?? text.trim();
    const delimiter = single.includes(';')
      ? ';'
      : single.includes(',')
        ? ','
        : null;
    if (!delimiter) return [single];

    return single
      .split(delimiter)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private normalize(data: unknown): StoredWheelItem[] | null {
    if (!Array.isArray(data)) return null;

    const items: StoredWheelItem[] = [];
    const counts = new Map<string, StoredWheelItem>();

    for (const entry of data.slice(0, MAX_ITEMS)) {
      if (typeof entry === 'string' || typeof entry === 'number') {
        const label = String(entry).trim().slice(0, MAX_LABEL_LENGTH);
        if (!label) continue;

        const key = normalizeLabel(label);
        const existing = counts.get(key);
        if (existing) {
          existing.weight = clampWeight(existing.weight + MIN_WEIGHT);
        } else {
          const item: StoredWheelItem = { label, weight: MIN_WEIGHT };
          counts.set(key, item);
          items.push(item);
        }
        continue;
      }

      if (!entry || typeof entry !== 'object') continue;

      const record = entry as Record<string, unknown>;
      const label = String(record['label'] ?? record['name'] ?? '')
        .trim()
        .slice(0, MAX_LABEL_LENGTH);
      if (!label) continue;

      const weight = Number(record['weight'] ?? record['value']);
      items.push({
        label,
        weight: Number.isFinite(weight) ? clampWeight(weight) : MIN_WEIGHT,
      });
    }

    return items;
  }

  private normalizeHistory(data: unknown): WheelHistoryEntry[] {
    if (!Array.isArray(data)) return [];

    const entries: WheelHistoryEntry[] = [];
    for (const entry of data.slice(0, MAX_HISTORY)) {
      if (!entry || typeof entry !== 'object') continue;

      const record = entry as Record<string, unknown>;
      const label = String(record['label'] ?? '')
        .trim()
        .slice(0, MAX_LABEL_LENGTH);
      const color = String(record['color'] ?? '');
      const id = Number(record['id']);
      const at = Number(record['at']);
      if (!label || !color || !Number.isFinite(id) || !Number.isFinite(at)) {
        continue;
      }

      entries.push({ id, label, color, at });
    }

    return entries;
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
}
