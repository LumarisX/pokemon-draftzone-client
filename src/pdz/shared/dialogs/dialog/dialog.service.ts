import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Injector,
  Signal,
  Type,
  WritableSignal,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { DialogSize } from './dialog.component';
import { DialogHostComponent } from './dialog-host.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';

export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');

export interface DialogConfig<D = unknown> {
  heading?: string;
  subheading?: string;
  size?: DialogSize;
  dismissible?: boolean;
  data?: D;
}

export type DialogChrome = Omit<DialogConfig, 'data'>;

export class DialogRef<R = unknown> {
  private readonly settled = signal(false);
  private resolve!: (result: R | undefined) => void;
  private readonly chrome: WritableSignal<DialogChrome>;

  readonly config: Signal<DialogChrome>;

  readonly closed = new Promise<R | undefined>((resolve) => {
    this.resolve = resolve;
  });

  constructor(
    chrome: DialogChrome,
    private readonly destroy: () => void,
  ) {
    this.chrome = signal(chrome);
    this.config = this.chrome.asReadonly();
  }

  /** Lets the hosted component retitle or resize its own dialog while open. */
  update(chrome: DialogChrome) {
    this.chrome.update((current) => ({ ...current, ...chrome }));
  }

  close(result?: R) {
    if (this.settled()) return;
    this.settled.set(true);
    this.resolve(result);
    this.destroy();
  }
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);

  open<C, R = unknown, D = unknown>(
    component: Type<C>,
    config: DialogConfig<D> = {},
  ): DialogRef<R> {
    let hostRef: ComponentRef<DialogHostComponent> | undefined;

    const { data, ...chrome } = config;

    const ref = new DialogRef<R>(chrome, () => {
      hostRef?.instance.dismiss();
      const pending = hostRef;
      hostRef = undefined;
      setTimeout(() => {
        pending?.destroy();
      }, TEARDOWN_DELAY);
    });

    hostRef = createComponent(DialogHostComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: Injector.create({
        providers: [
          { provide: DIALOG_DATA, useValue: data },
          { provide: DialogRef, useValue: ref },
        ],
        parent: this.injector,
      }),
    });

    hostRef.setInput('component', component);
    hostRef.instance.dismissed.subscribe(() => ref.close());

    this.appRef.attachView(hostRef.hostView);
    this.document.body.appendChild(hostRef.location.nativeElement);

    return ref;
  }

  confirm(
    heading: string,
    data: ConfirmDialogData = {},
    config: Omit<DialogConfig, 'data'> = {},
  ): Promise<boolean> {
    return this.open<ConfirmDialogComponent, boolean, ConfirmDialogData>(
      ConfirmDialogComponent,
      { size: 'sm', ...config, heading, data },
    ).closed.then((result) => result === true);
  }
}

const TEARDOWN_DELAY = 300;
