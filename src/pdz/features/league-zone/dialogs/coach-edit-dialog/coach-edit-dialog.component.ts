import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldErrorDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';

export interface CoachEditDialogData {
  name: string;
  gameName: string;
  discordName: string;
  timezone: string;
}

export type CoachEditDialogResult = CoachEditDialogData;

@Component({
  selector: 'pdz-coach-edit-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    FieldErrorDirective,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './coach-edit-dialog.component.html',
  styleUrl: './coach-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<CoachEditDialogResult>;
  protected readonly data = inject<CoachEditDialogData>(DIALOG_DATA);

  protected readonly timezones = Intl.supportedValuesOf('timeZone');

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.name ?? '', Validators.required],
    gameName: [this.data.gameName ?? '', Validators.required],
    discordName: [this.data.discordName ?? '', Validators.required],
    timezone: [this.data.timezone ?? '', Validators.required],
  });

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close(this.form.getRawValue());
  }
}
