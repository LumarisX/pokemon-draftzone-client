import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldErrorDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { first } from 'rxjs/operators';
import { TierListService } from '../../tier-list.service';

export interface TierListSettingsDialogData {
  name: string;
  description?: string;
}

@Component({
  selector: 'pdz-tier-list-settings-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    FieldErrorDirective,
    InputDirective,
  ],
  templateUrl: './tier-list-settings-dialog.component.html',
  styleUrls: ['./tier-list-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListSettingsDialogComponent {
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<TierListSettingsDialogData>;
  protected readonly data = inject<TierListSettingsDialogData>(DIALOG_DATA);
  private readonly tierListService = inject(TierListService);
  private readonly fb = inject(FormBuilder);

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.name, [Validators.required, Validators.maxLength(100)]],
    description: [this.data.description ?? '', Validators.maxLength(500)],
  });

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);

    const raw = this.form.getRawValue();
    const payload: TierListSettingsDialogData = {
      name: raw.name.trim(),
      description: raw.description.trim() || undefined,
    };

    this.tierListService
      .updateSettings(payload)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ref.close(payload);
        },
        error: () => {
          this.isSaving.set(false);
          this.saveError.set('Failed to save settings. Please try again.');
        },
      });
  }
}
