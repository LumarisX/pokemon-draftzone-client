import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { DataService } from '@pdz/core/services/data.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { ChoiceCardComponent } from '@pdz/shared/inputs/choice-cards/choice-card.component';
import { ChoiceCardsComponent } from '@pdz/shared/inputs/choice-cards/choice-cards.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldHintDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  PickedTierList,
  TierListPickerComponent,
  TierListPickerData,
} from '../tier-list-picker/tier-list-picker.component';
import { TierListService } from '../tier-list.service';

type Start = 'scratch' | 'copy' | 'import';

@Component({
  selector: 'pdz-tier-list-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    ChoiceCardComponent,
    ChoiceCardsComponent,
    FieldComponent,
    FieldHintDirective,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './tier-list-create.component.html',
  styleUrl: './tier-list-create.component.scss',
})
export class TierListCreateComponent {
  private readonly tierListService = inject(TierListService);
  private readonly dataService = inject(DataService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);

  protected readonly tierListPath = TIER_LIST_PATH;
  protected readonly saving = signal(false);
  protected readonly start = signal<Start>('scratch');
  protected readonly source = signal<PickedTierList | null>(null);
  protected readonly copyName = signal('');

  protected readonly formats = toSignal(
    this.dataService.getFormatsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected readonly rulesets = toSignal(
    this.dataService.getRulesetsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    format: ['', Validators.required],
    ruleset: ['', Validators.required],
  });

  protected choose(start: Start): void {
    this.start.set(start);
    if (start === 'import') {
      this.router.navigate(['/', TIER_LIST_PATH, 'import']);
      return;
    }
    if (start === 'copy' && !this.source()) this.pickSource();
  }

  protected async pickSource(): Promise<void> {
    const picked = await this.dialogs.open<
      TierListPickerComponent,
      PickedTierList,
      TierListPickerData
    >(TierListPickerComponent, {
      heading: 'Copy a Tier List',
      size: 'md',
      data: { intro: 'Your copy starts as an exact match. Change anything; the original stays as it was.' },
    }).closed;
    if (!picked) return;
    this.source.set(picked);
    this.copyName.set(`${picked.name} (copy)`);
  }

  protected copy(): void {
    const source = this.source();
    if (!source || this.saving()) return;
    this.saving.set(true);
    this.tierListService
      .fork(source.slug, { name: this.copyName().trim() || undefined })
      .subscribe({
        next: (created) => {
          this.toasts.success(`${created.name} created.`);
          this.router.navigate(['/', TIER_LIST_PATH, created.slug, 'edit']);
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not copy that tier list.'));
        },
      });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    this.tierListService
      .create({
        name: value.name.trim(),
        description: value.description.trim() || undefined,
        format: value.format,
        ruleset: value.ruleset,
      })
      .subscribe({
        next: (created) => {
          this.toasts.success(`${created.name} created.`);
          this.router.navigate(['/', TIER_LIST_PATH, created.slug, 'edit']);
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not create that tier list.'));
        },
      });
  }
}
