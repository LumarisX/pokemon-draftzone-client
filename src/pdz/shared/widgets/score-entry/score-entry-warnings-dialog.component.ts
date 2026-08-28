import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  DIALOG_DATA,
  DialogRef,
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { ScoreEntryWarningGroup } from './score-entry.model';

export interface ScoreEntryWarningsData {
  groups: ScoreEntryWarningGroup[];
  submitLabel?: string;
}

@Component({
  selector: 'pdz-score-entry-warnings-dialog',
  imports: [ButtonComponent, IconComponent],
  template: `
    <ul class="checks__groups">
      @for (group of data.groups; track group.where) {
        <li class="checks__group">
          <span class="checks__where">{{ group.where }}</span>
          <ul class="checks__list">
            @for (message of group.messages; track message) {
              <li class="checks__item">
                <pdz-icon name="warning" [size]="14"></pdz-icon>
                <span>{{ message }}</span>
              </li>
            }
          </ul>
        </li>
      }
    </ul>

    <div class="pdz-dialog-actions">
      <button pdz-button color="neutral" (click)="ref.close(false)">
        Go back and fix
      </button>
      <button
        pdz-button
        variant="outlined"
        color="neutral"
        (click)="ref.close(true)"
      >
        {{ data.submitLabel ?? 'Submit anyway' }}
      </button>
    </div>
  `,
  styleUrl: './score-entry-warnings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreEntryWarningsDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as ScoreEntryWarningsData;
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
}

export function confirmScoreEntry(
  dialogs: DialogService,
  groups: ScoreEntryWarningGroup[],
  submitLabel?: string,
): Promise<boolean> {
  if (!groups.length) return Promise.resolve(true);

  return dialogs
    .open<ScoreEntryWarningsDialogComponent, boolean, ScoreEntryWarningsData>(
      ScoreEntryWarningsDialogComponent,
      {
        heading: 'Warnings',
        size: 'md',
        data: { groups, submitLabel },
      },
    )
    .closed.then((result) => result === true);
}
