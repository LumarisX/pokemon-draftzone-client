import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SignUpValue } from '../../tournament-settings/settings-schema';

export interface ReplaceCoachDialogData {
  teamName: string;
  candidates: SignUpValue[];
}

export interface ReplaceCoachDialogResult {
  applicationId: string;
  teamName: string;
  reason: string;
}

@Component({
  selector: 'pdz-replace-coach-dialog',
  imports: [
    FormsModule,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './replace-coach-dialog.component.html',
  styleUrl: './replace-coach-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceCoachDialogComponent {
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<ReplaceCoachDialogResult>;
  protected readonly data = inject<ReplaceCoachDialogData>(DIALOG_DATA);

  protected readonly applicationId = signal('');
  protected readonly reason = signal('');
  protected readonly teamName = signal('');

  protected readonly selected = computed(() =>
    this.data.candidates.find(
      (entry) => entry.applicationId === this.applicationId(),
    ),
  );

  protected readonly resolvedName = computed(
    () => this.teamName().trim() || this.selected()?.teamName || '',
  );

  protected pick(applicationId: string): void {
    this.applicationId.set(applicationId);
    this.teamName.set('');
  }

  protected confirm(): void {
    const applicationId = this.applicationId();
    if (!applicationId) return;
    this.ref.close({
      applicationId,
      teamName: this.resolvedName(),
      reason: this.reason().trim(),
    });
  }
}
