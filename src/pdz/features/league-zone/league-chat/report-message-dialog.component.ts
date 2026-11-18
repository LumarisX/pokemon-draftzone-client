import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { CHAT_REPORT_REASON_MAX } from './league-chat.model';

export interface ReportMessageDialogData {
  messageId: string;
  text: string;
}

@Component({
  selector: 'pdz-report-message-dialog',
  imports: [FormsModule, ButtonComponent, FieldComponent, InputDirective],
  template: `
    <div class="report">
      <blockquote class="report__quote">{{ data.text }}</blockquote>
      <label
        pdz-field
        label="Reason"
        hint="Your report goes to this tournament's organizers."
        [error]="error()"
        required
      >
        <textarea
          pdz-input
          rows="3"
          name="reason"
          [attr.maxlength]="max"
          [ngModel]="reason()"
          (ngModelChange)="reason.set($event)"
        ></textarea>
      </label>
    </div>
    <div class="pdz-dialog-actions">
      <button
        pdz-button
        type="button"
        variant="outlined"
        color="neutral"
        (click)="ref.close()"
      >
        Cancel
      </button>
      <button
        pdz-button
        type="button"
        [loading]="sending()"
        (click)="send()"
      >
        Send Report
      </button>
    </div>
  `,
  styleUrl: './report-message-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportMessageDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly data = inject<ReportMessageDialogData>(DIALOG_DATA);
  private readonly service = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);

  protected readonly max = CHAT_REPORT_REASON_MAX;
  protected readonly reason = signal('');
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected send(): void {
    if (this.sending()) return;
    const reason = this.reason().trim();
    if (!reason) {
      this.error.set('Tell the organizers what is wrong with this message.');
      return;
    }
    this.error.set(null);
    this.sending.set(true);
    this.service.reportChatMessage(this.data.messageId, reason).subscribe({
      next: () => {
        this.toast.success('Report sent.');
        this.ref.close(true);
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(apiErrorMessage(error, 'Could not send the report.'));
      },
    });
  }
}
