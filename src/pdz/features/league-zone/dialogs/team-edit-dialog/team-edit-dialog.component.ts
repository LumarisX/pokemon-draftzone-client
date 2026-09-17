import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldErrorDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

export interface TeamEditDialogData {
  teamName: string;
  logoUrl?: string;
}

export interface TeamEditDialogResult {
  teamName: string;
  logoFile: File | null;
}

const ACCEPTED_LOGO_TYPES = ['image/png', 'image/svg+xml'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'pdz-team-edit-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    FieldErrorDirective,
    InputDirective,
    IconComponent,
  ],
  templateUrl: './team-edit-dialog.component.html',
  styleUrl: './team-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamEditDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected readonly ref = inject(DialogRef) as DialogRef<TeamEditDialogResult>;
  protected readonly data = inject<TeamEditDialogData>(DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    teamName: [this.data.teamName ?? '', Validators.required],
  });

  protected readonly logoFileName = signal('');
  protected readonly logoError = signal<string | null>(null);
  protected readonly previewUrl = signal(this.data.logoUrl);

  private logoFile: File | null = null;
  private objectUrl?: string;

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  protected onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !ACCEPTED_LOGO_TYPES.includes(file.type)) {
      input.value = '';
      this.logoError.set('Logo must be a PNG or SVG file.');
      return;
    }

    if (file && file.size > MAX_LOGO_BYTES) {
      input.value = '';
      this.logoError.set('Logo must be 2 MB or smaller.');
      return;
    }

    this.revokeObjectUrl();
    this.logoError.set(null);

    if (file) {
      this.logoFile = file;
      this.logoFileName.set(file.name);
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl.set(this.objectUrl);
    } else {
      this.logoFile = null;
      this.logoFileName.set('');
      this.previewUrl.set(this.data.logoUrl);
    }
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close({
      teamName: this.form.getRawValue().teamName,
      logoFile: this.logoFile,
    });
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
