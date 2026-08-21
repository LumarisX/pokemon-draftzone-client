import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { TooltipComponent } from './tooltip.component';
import { TooltipPosition } from './tooltip-placement';

const SHOW_DELAY = 150;
const HIDE_DELAY = 80;

export interface TooltipRequest {
  anchor: HTMLElement;
  content: string;
  position: TooltipPosition;
}

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private readonly store = signal<TooltipRequest | null>(null);
  readonly visible = this.store.asReadonly();

  private hostRef?: ComponentRef<TooltipComponent>;
  private armed: HTMLElement | null = null;
  private showHandle?: ReturnType<typeof setTimeout>;
  private hideHandle?: ReturnType<typeof setTimeout>;

  show(anchor: HTMLElement, content: string, position: TooltipPosition) {
    clearTimeout(this.showHandle);
    clearTimeout(this.hideHandle);
    this.armed = anchor;
    this.mountHost();

    const commit = () => {
      if (this.armed !== anchor) return;
      this.store.set({ anchor, content, position });
    };

    if (this.store()) {
      commit();
    } else {
      this.showHandle = setTimeout(commit, SHOW_DELAY);
    }
  }

  hide(anchor: HTMLElement) {
    if (this.armed !== anchor) return;
    clearTimeout(this.showHandle);
    clearTimeout(this.hideHandle);
    this.armed = null;
    this.hideHandle = setTimeout(() => {
      if (this.armed === null) this.store.set(null);
    }, HIDE_DELAY);
  }

  dismiss() {
    clearTimeout(this.showHandle);
    clearTimeout(this.hideHandle);
    this.armed = null;
    this.store.set(null);
  }

  isAnchor(element: HTMLElement) {
    return this.store()?.anchor === element;
  }

  private mountHost() {
    if (this.hostRef) return;

    this.hostRef = createComponent(TooltipComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(this.hostRef.hostView);
    this.document.body.appendChild(this.hostRef.location.nativeElement);

    this.document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.store()) this.dismiss();
    });
    this.document.addEventListener(
      'scroll',
      () => {
        if (this.store()) this.dismiss();
      },
      { capture: true, passive: true },
    );
    this.document.defaultView?.addEventListener('resize', () => {
      if (this.store()) this.dismiss();
    });
  }
}
