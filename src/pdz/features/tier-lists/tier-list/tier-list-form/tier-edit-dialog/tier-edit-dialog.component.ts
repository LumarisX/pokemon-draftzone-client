import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldErrorDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

export interface TierDialogData {
  tier?: { name: string; cost?: number };
}

export interface TierDialogResult {
  name: string;
  cost: number;
}

@Component({
  selector: 'pdz-tier-edit-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    FieldErrorDirective,
    InputDirective,
  ],
  templateUrl: './tier-edit-dialog.component.html',
  styleUrls: ['./tier-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierEditDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<TierDialogResult>;
  protected readonly data = (inject(DIALOG_DATA) ?? {}) as TierDialogData;
  private readonly fb = inject(FormBuilder);

  protected readonly isAddMode = !this.data.tier;

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data.tier?.name ?? '',
      [Validators.required, Validators.maxLength(30)],
    ],
    cost: [this.data.tier?.cost ?? 0, Validators.required],
  });

  constructor() {
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const trimmed = value?.trim() ?? '';
        if (trimmed === '') return;
        const cost = Number(trimmed);
        if (Number.isFinite(cost)) {
          this.form.controls.cost.setValue(cost, { emitEvent: false });
        }
      });
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, cost } = this.form.getRawValue();
    this.ref.close({ name: name.trim(), cost: Number(cost) });
  }
}
