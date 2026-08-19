import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  computed,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { ToastHostComponent } from './toast-host.component';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastOptions {
  title?: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
}

export interface Toast {
  id: number;
  tone: ToastTone;
  title?: string;
  message?: string;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  leaving: boolean;
}

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

const MAX_VISIBLE = 4;
const LEAVE_DURATION = 180;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private readonly store = signal<Toast[]>([]);
  private readonly timers = new Map<number, ToastTimer>();
  private hostRef?: ComponentRef<ToastHostComponent>;
  private nextId = 0;

  readonly toasts = computed(() => this.store());

  success(message: string, options: ToastOptions = {}) {
    return this.show({ ...options, message, tone: 'success' });
  }

  error(message: string, options: ToastOptions = {}) {
    return this.show({ ...options, message, tone: 'error' });
  }

  warning(message: string, options: ToastOptions = {}) {
    return this.show({ ...options, message, tone: 'warning' });
  }

  info(message: string, options: ToastOptions = {}) {
    return this.show({ ...options, message, tone: 'info' });
  }

  show(options: ToastOptions): number {
    const tone = options.tone ?? 'info';
    const toast: Toast = {
      id: this.nextId++,
      tone,
      title: options.title,
      message: options.message,
      duration: options.duration ?? DEFAULT_DURATION[tone],
      dismissible: options.dismissible ?? true,
      action: options.action,
      leaving: false,
    };

    const mounted = this.mountHost();
    const push = () => {
      const live = this.store().filter((t) => !t.leaving);
      live
        .slice(0, Math.max(0, live.length + 1 - MAX_VISIBLE))
        .forEach((t) => this.dismiss(t.id));
      this.store.update((toasts) => [...toasts, toast]);
      this.startTimer(toast);
    };

    if (mounted) {
      setTimeout(push);
    } else {
      push();
    }

    return toast.id;
  }

  dismiss(id: number) {
    this.clearTimer(id);
    if (!this.store().some((toast) => toast.id === id && !toast.leaving)) {
      return;
    }
    this.patch(id, { leaving: true });
    setTimeout(() => this.remove(id), LEAVE_DURATION);
  }

  clear() {
    this.store().forEach((toast) => this.dismiss(toast.id));
  }

  pause(id: number) {
    const timer = this.timers.get(id);
    if (!timer || timer.pausedAt !== undefined) return;
    clearTimeout(timer.handle);
    timer.pausedAt = Date.now();
    timer.remaining -= timer.pausedAt - timer.startedAt;
  }

  resume(id: number) {
    const timer = this.timers.get(id);
    if (!timer || timer.pausedAt === undefined) return;
    timer.pausedAt = undefined;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), Math.max(0, timer.remaining));
  }

  runAction(toast: Toast) {
    toast.action?.run();
    this.dismiss(toast.id);
  }

  private startTimer(toast: Toast) {
    if (toast.duration <= 0) return;
    this.timers.set(toast.id, {
      handle: setTimeout(() => this.dismiss(toast.id), toast.duration),
      remaining: toast.duration,
      startedAt: Date.now(),
      pausedAt: undefined,
    });
  }

  private clearTimer(id: number) {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  private patch(id: number, changes: Partial<Toast>) {
    this.store.update((toasts) =>
      toasts.map((toast) => (toast.id === id ? { ...toast, ...changes } : toast)),
    );
  }

  private remove(id: number) {
    this.store.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private mountHost(): boolean {
    if (this.hostRef) return false;

    this.hostRef = createComponent(ToastHostComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(this.hostRef.hostView);
    this.document.body.appendChild(this.hostRef.location.nativeElement);
    return true;
  }
}

interface ToastTimer {
  handle: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
  pausedAt: number | undefined;
}
