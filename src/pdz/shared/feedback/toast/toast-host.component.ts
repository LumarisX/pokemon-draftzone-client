import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
} from '@angular/core';
import { ToastComponent } from './toast.component';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'pdz-toast-host',
  imports: [ToastComponent],
  template: `
    @for (toast of service.toasts(); track toast.id) {
      <pdz-toast
        [tone]="toast.tone"
        [heading]="toast.title"
        [message]="toast.message"
        [actionLabel]="toast.action?.label"
        [dismissible]="toast.dismissible"
        [leaving]="toast.leaving"
        [duration]="toast.duration"
        (mouseenter)="service.pause(toast.id)"
        (mouseleave)="service.resume(toast.id)"
        (focusin)="service.pause(toast.id)"
        (focusout)="service.resume(toast.id)"
        (action)="run(toast)"
        (dismissed)="service.dismiss(toast.id)"
      />
    }
  `,
  styleUrl: './toast-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-toast-host',
    popover: 'manual',
    'aria-live': 'polite',
    'aria-atomic': 'false',
  },
})
export class ToastHostComponent {
  protected readonly service = inject(ToastService);

  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  private wasEmpty = true;

  constructor() {
    afterNextRender(() => this.raise());

    effect(() => {
      const count = this.service.toasts().length;
      if (count > 0 && this.wasEmpty) this.raise();
      this.wasEmpty = count === 0;
    });
  }

  protected run(toast: Toast) {
    this.service.runAction(toast);
  }

  private raise() {
    const element = this.element.nativeElement;
    if (typeof element.showPopover !== 'function') return;

    const parent = this.topLayerOwner();
    try {
      if (element.matches(':popover-open')) element.hidePopover();
      if (element.parentElement !== parent) parent.appendChild(element);
      element.showPopover();
    } catch {
      /* empty */
    }
  }

  private topLayerOwner(): HTMLElement {
    const dialogs = Array.from(
      this.document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
    ).filter((dialog) => dialog.matches(':modal'));
    const topmost = dialogs[dialogs.length - 1];
    if (!topmost) return this.document.body;
    topmost.addEventListener('close', () => this.raise(), { once: true });
    return topmost;
  }
}
