import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { DataService } from '@pdz/core/services/data.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldHintDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListService } from '../tier-list.service';

@Component({
  selector: 'pdz-tier-list-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
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

  protected readonly tierListPath = TIER_LIST_PATH;
  protected readonly saving = signal(false);

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
          this.toasts.error(
            err?.error?.message ?? 'Could not create that tier list.',
          );
        },
      });
  }
}
