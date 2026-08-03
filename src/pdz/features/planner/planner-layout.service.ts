import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'plannerLayout';

/**
 * Which planner widgets the user has collapsed. Kept global rather than
 * per-draft: the set of widgets someone cares about is a working preference,
 * not a property of any one draft plan.
 */
@Injectable({ providedIn: 'root' })
export class PlannerLayoutService {
  private readonly collapsed = signal<ReadonlySet<string>>(readStored());

  isCollapsed(widgetId: string): boolean {
    return this.collapsed().has(widgetId);
  }

  toggle(widgetId: string): void {
    const next = new Set(this.collapsed());
    if (!next.delete(widgetId)) next.add(widgetId);
    this.collapsed.set(next);
    writeStored(next);
  }
}

function readStored(): ReadonlySet<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id) => typeof id === 'string'));
    }
  } catch {
    console.warn('Invalid plannerLayout format in localStorage');
  }
  return new Set();
}

function writeStored(collapsed: ReadonlySet<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
}
