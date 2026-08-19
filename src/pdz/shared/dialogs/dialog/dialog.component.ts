import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type DialogSize = 'sm' | 'md' | 'lg' | 'full';

let nextDialogId = 0;

@Component({
  selector: 'pdz-dialog',
  imports: [ButtonComponent, IconComponent],
  template: `
    <dialog
      #surface
      class="pdz-dialog__surface"
      [attr.data-size]="size()"
      [attr.aria-labelledby]="heading() ? headingId : null"
      (cancel)="onCancel($event)"
      (click)="onSurfaceClick($event)"
      (close)="onNativeClose()"
    >
      <div class="pdz-dialog__panel">
        <header class="pdz-dialog__header">
          <div class="pdz-dialog__titles">
            @if (heading()) {
              <h2 class="pdz-dialog__heading" [id]="headingId">
                {{ heading() }}
              </h2>
            }
            @if (subheading()) {
              <p class="pdz-dialog__subheading">{{ subheading() }}</p>
            }
            <ng-content select="[pdz-dialog-header]" />
          </div>
          @if (dismissible()) {
            <button
              pdz-button
              class="pdz-dialog__close"
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              pill
              aria-label="Close dialog"
              (click)="close()"
            >
              <pdz-icon aria-hidden="true" name="xmark" [size]="14" />
            </button>
          }
        </header>
        <div class="pdz-dialog__body"><ng-content /></div>
        <footer class="pdz-dialog__footer">
          <ng-content select="[pdz-dialog-footer]" />
        </footer>
      </div>
    </dialog>
  `,
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pdz-dialog' },
})
export class DialogComponent {
  open = model(false);
  heading = input<string>();
  subheading = input<string>();
  size = input<DialogSize>('md');
  dismissible = input(true, { transform: booleanAttribute });

  closed = output<void>();

  protected readonly headingId = `pdz-dialog-heading-${nextDialogId++}`;

  private readonly surface =
    viewChild.required<ElementRef<HTMLDialogElement>>('surface');
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const element = this.surface().nativeElement;
      if (this.open()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
      this.document.body.classList.toggle(
        'pdz-dialog-scroll-lock',
        this.open(),
      );
    });
  }

  close() {
    this.open.set(false);
  }

  protected onCancel(event: Event) {
    event.preventDefault();
    if (this.dismissible()) this.close();
  }

  protected onSurfaceClick(event: MouseEvent) {
    if (!this.dismissible()) return;
    if (event.target === this.surface().nativeElement) this.close();
  }

  protected onNativeClose() {
    this.open.set(false);
    this.closed.emit();
  }
}
