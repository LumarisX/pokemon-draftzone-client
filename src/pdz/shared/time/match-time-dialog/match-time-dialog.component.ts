import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { CountdownComponent } from '../countdown/countdown.component';
import { TimeConverterComponent } from '../time-converter/time-converter.component';
import { findTimeZone, localTimeZone, TimeZone } from '../timezone';

export interface MatchTimeDialogData {
  opponentName: string;
  scheduledDate?: string | null;
  opponentTimezone?: string | null;
  localTimezone?: string | null;
  allowClear?: boolean;
}

export type MatchTimeDialogResult = {
  scheduledDate: string | null;
  opponentTimezone?: string;
};

@Component({
  selector: 'pdz-match-time-dialog',
  imports: [ButtonComponent, TimeConverterComponent, CountdownComponent],
  templateUrl: './match-time-dialog.component.html',
  styleUrl: './match-time-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchTimeDialogComponent {
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<MatchTimeDialogResult>;
  protected readonly data = inject<MatchTimeDialogData>(DIALOG_DATA);

  protected readonly scheduled = signal<string | null>(
    this.data.scheduledDate ?? null,
  );
  protected readonly localZone = signal<TimeZone>(
    findTimeZone(this.data.localTimezone) ?? localTimeZone(),
  );
  protected readonly opponentZone = signal<TimeZone>(
    findTimeZone(this.data.opponentTimezone) ?? localTimeZone(),
  );

  protected readonly canClear =
    (this.data.allowClear ?? true) && !!this.data.scheduledDate;

  protected onSave(): void {
    const scheduledDate = this.scheduled();
    if (!scheduledDate) return;
    this.ref.close({
      scheduledDate,
      opponentTimezone: this.opponentZone().name,
    });
  }

  protected onClear(): void {
    this.ref.close({ scheduledDate: null });
  }
}
