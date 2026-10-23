import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { DataService } from '@pdz/core/services/data.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { TournamentTierListService } from './tournament-tier-list.service';

export type BlankDialogData = { tournamentName: string };

@Component({
  selector: 'pdz-tier-list-blank-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, FieldComponent, InputDirective, SelectComponent, SelectOptionComponent],
  template: `
    <form class="blank" (ngSubmit)="create()">
      <label pdz-field label="Name" required>
        <input
          pdz-input
          name="name"
          maxlength="100"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
        />
      </label>
      <div class="blank__row">
        <div pdz-field label="Format" required>
          <pdz-select
            aria-label="Format"
            placeholder="Choose a format…"
            searchable
            [ngModel]="format()"
            (ngModelChange)="format.set($event)"
            [ngModelOptions]="{ standalone: true }"
          >
            @for (option of formats(); track option) {
              <pdz-option [value]="option" [label]="option" />
            }
          </pdz-select>
        </div>
        <div pdz-field label="Ruleset" required>
          <pdz-select
            aria-label="Ruleset"
            placeholder="Choose a ruleset…"
            searchable
            [ngModel]="ruleset()"
            (ngModelChange)="ruleset.set($event)"
            [ngModelOptions]="{ standalone: true }"
          >
            @for (option of rulesets(); track option) {
              <pdz-option [value]="option" [label]="option" />
            }
          </pdz-select>
        </div>
      </div>
      <div class="pdz-dialog-actions">
        <button pdz-button type="button" variant="outlined" color="neutral" (click)="ref.close()">
          Cancel
        </button>
        <button pdz-button type="submit" [loading]="saving()">Start Building</button>
      </div>
    </form>
  `,
  styleUrl: './tier-list-blank-dialog.component.scss',
})
export class TierListBlankDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly data = inject<BlankDialogData>(DIALOG_DATA);
  private readonly service = inject(TournamentTierListService);
  private readonly dataService = inject(DataService);
  private readonly toasts = inject(ToastService);

  protected readonly name = signal(`${this.data.tournamentName} Tier List`);
  protected readonly format = signal('');
  protected readonly ruleset = signal('');
  protected readonly saving = signal(false);

  protected readonly formats = toSignal(
    this.dataService.getFormatsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );
  protected readonly rulesets = toSignal(
    this.dataService.getRulesetsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected create(): void {
    if (!this.name().trim() || !this.format() || !this.ruleset()) {
      this.toasts.error('Give the list a name, a format and a ruleset.');
      return;
    }
    this.saving.set(true);
    this.service
      .attach({
        blank: { name: this.name().trim(), format: this.format(), ruleset: this.ruleset() },
      })
      .subscribe({
        next: () => this.ref.close(true),
        error: (err) => {
          this.saving.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not start the tier list.'));
        },
      });
  }
}
