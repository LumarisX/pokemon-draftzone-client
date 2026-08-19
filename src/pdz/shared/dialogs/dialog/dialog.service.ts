import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Injector,
  Type,
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

export class DialogRef<R = unknown> {
  private readonly settled = signal(false);
  private resolve!: (result: R | undefined) => void;

  readonly closed = new Promise<R | undefined>((resolve) => {
    this.resolve = resolve;
  });

  constructor(private readonly destroy: () => void) {}

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

    const ref = new DialogRef<R>(() => {
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
          { provide: DIALOG_DATA, useValue: config.data },
          { provide: DialogRef, useValue: ref },
        ],
        parent: this.injector,
      }),
    });

    hostRef.setInput('component', component);
    hostRef.setInput('config', config);
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
