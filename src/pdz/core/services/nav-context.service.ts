import { Injectable, Signal, signal } from '@angular/core';

export interface NavDrawerContext {
  ariaLabel: string;
  isOpen: Signal<boolean>;
  toggle(): void;
  close(): void;
}

@Injectable({ providedIn: 'root' })
export class NavContextService {
  readonly drawer = signal<NavDrawerContext | null>(null);

  set(drawer: NavDrawerContext): void {
    this.drawer.set(drawer);
  }

  clear(drawer?: NavDrawerContext): void {
    if (!drawer || this.drawer() === drawer) {
      this.drawer.set(null);
    }
  }
}
