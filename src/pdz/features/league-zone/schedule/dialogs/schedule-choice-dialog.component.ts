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
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';

export interface ScheduleChoice {
  value: string;
  label: string;
  group?: string;
  description?: string;
}

interface ChoiceData {
  label: string;
  hint?: string;
  options: ScheduleChoice[];
  value: string | null;
  confirmLabel: string;
}

@Component({
  selector: 'pdz-schedule-choice-dialog',
  imports: [ButtonComponent, FieldComponent, SelectComponent, SelectOptionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div pdz-field [label]="data.label" [hint]="data.hint">
      <pdz-select
        searchable
        [aria-label]="data.label"
        [value]="value()"
        [showGroupInTrigger]="false"
        (valueChange)="value.set($any($event))"
      >
        @for (option of data.options; track option.value) {
          <pdz-option
            [value]="option.value"
            [label]="option.label"
            [group]="option.group"
            [description]="option.description"
          />
        }
      </pdz-select>
    </div>

    <div class="pdz-dialog-actions">
      <button pdz-button variant="ghost" color="neutral" (click)="ref.close()">
        Cancel
      </button>
      <button pdz-button (click)="submit()">
        {{ data.confirmLabel }}
      </button>
    </div>
  `,
})
export class ScheduleChoiceDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as ChoiceData;
  protected readonly ref = inject(DialogRef) as DialogRef<string>;
  protected readonly value = signal<string | null>(this.data.value);

  protected submit(): void {
    const value = this.value();
    if (value !== null) this.ref.close(value);
  }
}

export function chooseOne(
  dialogs: DialogService,
  heading: string,
  data: ChoiceData,
): Promise<string | undefined> {
  return dialogs.open<ScheduleChoiceDialogComponent, string, ChoiceData>(
    ScheduleChoiceDialogComponent,
    { heading, size: 'sm', data },
  ).closed;
}
