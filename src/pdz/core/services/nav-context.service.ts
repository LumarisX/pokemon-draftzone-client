import { Injectable, signal } from '@angular/core';
import type { BadgeTone } from '@pdz/shared/data/badge/badge.component';

export interface NavMenuLink {
  label: string;
  route?: string[];
  href?: string;
  icon?: string;
  badge?: string | null;
  badgeTone?: BadgeTone;
  groupLabel?: string;
}

export interface NavMenuContext {
  ariaLabel: string;
  items: NavMenuLink[];
}

/**
 * Lets a feature area (e.g. the tournament section) swap what the global
 * navbar's mobile menu shows, instead of shipping its own separate menu
 * trigger. Set on entry to the section, cleared on the way out.
 */
@Injectable({ providedIn: 'root' })
export class NavContextService {
  readonly context = signal<NavMenuContext | null>(null);

  set(context: NavMenuContext): void {
    this.context.set(context);
  }

  clear(): void {
    this.context.set(null);
  }
}
