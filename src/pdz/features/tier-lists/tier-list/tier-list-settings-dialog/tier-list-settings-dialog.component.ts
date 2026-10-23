import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { DataService } from '@pdz/core/services/data.service';
import { TierListSettings } from '@pdz/features/tier-lists/tier-list.model';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import {
  FieldErrorDirective,
  FieldHintDirective,
} from '@pdz/shared/inputs/field/field-message.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

export type TierListSettingsDialogData = TierListSettings;

const MAX_TAGS = 8;

@Component({
  selector: 'pdz-tier-list-settings-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './tier-list-settings-dialog.component.html',
  styleUrls: ['./tier-list-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListSettingsDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<TierListSettingsDialogData>;
  protected readonly data = inject<TierListSettingsDialogData>(DIALOG_DATA);
  private readonly tierListService = inject(TierListService);
  private readonly dataService = inject(DataService);
  private readonly fb = inject(FormBuilder);

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly canChangeRules = computed(
    () => this.data.isTournamentCopy || this.data.access === 'manage',
  );
  protected readonly canTag = computed(
    () => !this.data.isTournamentCopy && this.data.access === 'manage',
  );

  protected readonly formats = toSignal(
    this.dataService.getFormatsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );
  protected readonly rulesets = toSignal(
    this.dataService.getRulesetsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.name, [Validators.required, Validators.maxLength(100)]],
    description: [this.data.description ?? '', Validators.maxLength(500)],
    tags: [(this.data.tags ?? []).join(', ')],
    format: [this.data.format],
    ruleset: [this.data.ruleset],
  });

  private tagsFrom(text: string): string[] {
    return [
      ...new Set(
        text
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ].slice(0, MAX_TAGS);
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);

    const raw = this.form.getRawValue();
    const payload: Partial<TierListSettings> = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      ...(this.canTag() && { tags: this.tagsFrom(raw.tags) }),
      ...(this.canChangeRules() &&
        raw.format !== this.data.format && { format: raw.format }),
      ...(this.canChangeRules() &&
        raw.ruleset !== this.data.ruleset && { ruleset: raw.ruleset }),
    };

    this.tierListService
      .updateSettings(payload)
      .pipe(first())
      .subscribe({
        next: ({ settings }) => {
          this.isSaving.set(false);
          this.ref.close(settings);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.saveError.set(apiErrorMessage(err, 'Could not save the settings.'));
        },
      });
  }
}
