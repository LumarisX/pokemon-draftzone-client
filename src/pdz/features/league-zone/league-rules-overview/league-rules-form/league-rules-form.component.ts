import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuardsUnsavedChanges } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';

@Component({
  selector: 'pdz-league-rules-form',
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageHeaderComponent,
  ],
  templateUrl: './league-rules-form.component.html',
  styleUrl: './league-rules-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class LeagueRulesFormComponent implements OnInit, GuardsUnsavedChanges {
  private readonly leagueZoneService = inject(LeagueZoneService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rules = signal<League.RuleSection[]>([]);
  private readonly savedRules = signal<League.RuleSection[]>([]);
  readonly isSaving = signal(false);

  readonly hasUnsavedChanges = computed(
    () => JSON.stringify(this.rules()) !== JSON.stringify(this.savedRules()),
  );

  ngOnInit(): void {
    this.leagueZoneService
      .getRules()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ruleSections) => {
        const normalized = ruleSections.map((section) => ({
          title: section.title,
          body: section.body.replace(/\t/g, '  '),
        }));
        this.rules.set(normalized);
        this.savedRules.set(normalized);
      });
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  updateSection(index: number, patch: Partial<League.RuleSection>): void {
    this.rules.update((rules) =>
      rules.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  }

  addSection(): void {
    this.rules.update((rules) => [...rules, { title: 'New Section', body: '' }]);
  }

  deleteSection(index: number): void {
    this.rules.update((rules) => rules.filter((_, i) => i !== index));
  }

  move(index: number, offset: -1 | 1): void {
    const target = index + offset;
    this.rules.update((rules) => {
      if (target < 0 || target >= rules.length) return rules;
      const next = [...rules];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  saveRules(): void {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    const rules = this.rules();
    this.leagueZoneService
      .saveRules(rules)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savedRules.set(rules);
          this.isSaving.set(false);
          this.toast.success('Rules saved.');
        },
        error: () => {
          this.isSaving.set(false);
          this.toast.error('Could not save the rules. Try again.');
        },
      });
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) return true;
    return this.dialogs.confirm('Leave without saving?', {
      message: 'Your rule changes have not been saved.',
      confirmLabel: 'Leave',
      confirmColor: 'danger',
    });
  }
}
