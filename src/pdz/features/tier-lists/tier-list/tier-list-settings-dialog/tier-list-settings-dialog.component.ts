import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { first } from 'rxjs/operators';
import { TierListService } from '../../tier-list.service';

export interface TierListSettingsDialogData {
  name: string;
  description?: string;
}

function draftCountValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const group = control as FormGroup;
  const min = group.get('min')?.value;
  const max = group.get('max')?.value;
  if (min != null && max != null && min > max) {
    return { draftCountInvalid: true };
  }
  return null;
}

@Component({
  selector: 'pdz-tier-list-settings-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './tier-list-settings-dialog.component.html',
  styleUrls: ['./tier-list-settings-dialog.component.scss'],
})
export class TierListSettingsDialogComponent implements OnInit {
  dialogRef =
    inject<MatDialogRef<TierListSettingsDialogComponent>>(MatDialogRef);
  data = inject<TierListSettingsDialogData>(MAT_DIALOG_DATA);
  private tierListService = inject(TierListService);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.name, [Validators.required, Validators.maxLength(100)]],
      description: [this.data.description ?? '', Validators.maxLength(500)],
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    this.saveError.set(null);

    const raw = this.form.getRawValue();
    const payload: TierListSettingsDialogData = {
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
    };

    this.tierListService
      .updateSettings(payload)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.dialogRef.close(payload);
        },
        error: (err: unknown) => {
          this.isSaving.set(false);
          this.saveError.set('Failed to save settings. Please try again.');
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
