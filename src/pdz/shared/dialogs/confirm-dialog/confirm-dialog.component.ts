import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ButtonColor,
  ButtonComponent,
} from '@pdz/shared/buttons/button/button.component';
import { DIALOG_DATA, DialogRef } from '../dialog/dialog.service';

export interface ConfirmDialogData {
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonColor;
}

@Component({
  selector: 'pdz-confirm-dialog',
  imports: [ButtonComponent],
  template: `
    @if (data.message) {
      <p class="pdz-confirm__message">{{ data.message }}</p>
    }
    <div class="pdz-dialog-actions">
      <button
        pdz-button
        variant="outlined"
        color="neutral"
        (click)="ref.close(false)"
      >
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        pdz-button
        [color]="data.confirmColor ?? 'primary'"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
  styles: [
    `
      .pdz-confirm__message {
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = (inject(DIALOG_DATA) ?? {}) as ConfirmDialogData;
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
}
