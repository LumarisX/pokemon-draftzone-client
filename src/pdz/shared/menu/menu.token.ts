import { InjectionToken, Signal } from '@angular/core';

export type PdzMenuRole = 'menu' | 'group';

export interface PdzMenuPanel {
  readonly panelId: string;
  readonly isOpen: Signal<boolean>;
  readonly hasPopup: Signal<string>;
  registerTrigger(element: HTMLElement): void;
  toggle(): void;
  open(focus?: 'first' | 'last' | 'none'): void;
  close(restoreFocus?: boolean): void;
}

export const PDZ_MENU = new InjectionToken<PdzMenuPanel>('PDZ_MENU');
