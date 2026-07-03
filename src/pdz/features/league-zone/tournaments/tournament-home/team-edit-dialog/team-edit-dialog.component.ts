import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
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

export interface TeamEditDialogData {
  teamName: string;
  /** Resolved URL of the current logo, used for the preview. */
  logoUrl?: string;
}

export interface TeamEditDialogResult {
  teamName: string;
  /** The newly chosen logo file, or null if the logo was left unchanged. */
  logoFile: File | null;
}

@Component({
  selector: 'pdz-team-edit-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './team-edit-dialog.component.html',
  styleUrl: './team-edit-dialog.component.scss',
})
export class TeamEditDialogComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  dialogRef =
    inject<MatDialogRef<TeamEditDialogComponent, TeamEditDialogResult | null>>(
      MatDialogRef,
    );
  data = inject<TeamEditDialogData>(MAT_DIALOG_DATA);

  // Built at construction (not ngOnInit) so the field is populated from the
  // injected team data before the dialog view first renders.
  form: FormGroup = this.fb.group({
    teamName: [this.data.teamName ?? '', Validators.required],
  });
  logoFile: File | null = null;
  logoFileName = '';
  previewUrl = this.data.logoUrl;

  /** Object URL we created for the local preview, tracked so we can revoke it. */
  private objectUrl?: string;

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.revokeObjectUrl();

    if (file) {
      this.logoFile = file;
      this.logoFileName = file.name;
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl = this.objectUrl;
    } else {
      this.logoFile = null;
      this.logoFileName = '';
      this.previewUrl = this.data.logoUrl;
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      teamName: this.form.value.teamName,
      logoFile: this.logoFile,
    });
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
