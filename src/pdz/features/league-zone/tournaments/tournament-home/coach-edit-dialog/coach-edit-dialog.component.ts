import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface CoachEditDialogData {
  name: string;
  gameName: string;
  discordName: string;
  timezone: string;
}

export type CoachEditDialogResult = CoachEditDialogData;

@Component({
  selector: 'pdz-coach-edit-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './coach-edit-dialog.component.html',
  styleUrl: './coach-edit-dialog.component.scss',
})
export class CoachEditDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef =
    inject<
      MatDialogRef<CoachEditDialogComponent, CoachEditDialogResult | null>
    >(MatDialogRef);
  data = inject<CoachEditDialogData>(MAT_DIALOG_DATA);

  timezones = Intl.supportedValuesOf('timeZone');

  form: FormGroup = this.fb.group({
    name: [this.data.name ?? '', Validators.required],
    gameName: [this.data.gameName ?? '', Validators.required],
    discordName: [this.data.discordName ?? '', Validators.required],
    timezone: [this.data.timezone ?? '', Validators.required],
  });

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value as CoachEditDialogResult);
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }
}
