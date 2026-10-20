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
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

export interface StageSettings {
  name: string;
  start: number;
  public: boolean;
}

interface StageSettingsData extends StageSettings {
  weeks: { index: number; label: string }[];
}

@Component({
  selector: 'pdz-stage-settings-dialog',
  imports: [
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stage-settings">
      <label pdz-field label="Stage Name" [error]="nameError()">
        <input
          pdz-input
          type="text"
          [value]="name()"
          (input)="name.set($any($event.target).value)"
        />
      </label>
      <div
        pdz-field
        label="Starts In"
        hint="Every match in the stage moves with it."
      >
        <pdz-select
          aria-label="Starts in"
          [value]="start()"
          (valueChange)="start.set($any($event))"
        >
          @for (week of data.weeks; track week.index) {
            <pdz-option [value]="week.index" [label]="week.label" />
          }
        </pdz-select>
      </div>
      <label
        pdz-check
        label="Visible to everyone"
        description="Hidden stages are organizer-only."
      >
        <input
          pdz-checkbox
          type="checkbox"
          [checked]="visible()"
          (change)="visible.set($any($event.target).checked)"
        />
      </label>
    </div>

    <div class="pdz-dialog-actions">
      <button pdz-button variant="ghost" color="neutral" (click)="ref.close()">
        Cancel
      </button>
      <button pdz-button (click)="save()">Save Stage</button>
    </div>
  `,
  styles: `
    .stage-settings {
      display: flex;
      flex-direction: column;
      gap: var(--pdz-space-md);
    }
  `,
})
export class StageSettingsDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as StageSettingsData;
  protected readonly ref = inject(DialogRef) as DialogRef<StageSettings>;

  protected readonly name = signal(this.data.name);
  protected readonly start = signal(this.data.start);
  protected readonly visible = signal(this.data.public);
  protected readonly nameError = signal<string | null>(null);

  protected save(): void {
    const name = this.name().trim();
    if (!name) {
      this.nameError.set('Give the stage a name.');
      return;
    }
    this.ref.close({ name, start: this.start(), public: this.visible() });
  }
}

export function editStageSettings(
  dialogs: DialogService,
  data: StageSettingsData,
): Promise<StageSettings | undefined> {
  return dialogs.open<
    StageSettingsDialogComponent,
    StageSettings,
    StageSettingsData
  >(StageSettingsDialogComponent, {
    heading: 'Stage Settings',
    size: 'sm',
    data,
  }).closed;
}
