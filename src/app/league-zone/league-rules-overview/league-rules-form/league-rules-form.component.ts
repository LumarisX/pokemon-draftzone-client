import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { League } from '../../league.interface';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'pdz-league-rules-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './league-rules-form.component.html',
  styleUrls: ['./league-rules-form.component.scss'],
})
export class LeagueRulesFormComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  rules = signal<League.RuleSection[]>([]);
  originalRules = signal<League.RuleSection[]>([]);
  hasUnsavedChanges = signal(false);
  isSaving = signal(false);
  saveMessage = signal<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  ngOnInit(): void {
    this.leagueZoneService
      .getRules()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ruleSections) => {
        const normalized = ruleSections.map((section) => ({
          ...section,
          body: section.body.replace(/\t/g, '  '),
        }));
        this.rules.set(normalized);
        this.originalRules.set(JSON.parse(JSON.stringify(normalized)));
        this.hasUnsavedChanges.set(false);
      });

    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (this.hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  onRuleChange(): void {
    this.hasUnsavedChanges.set(
      JSON.stringify(this.rules()) !== JSON.stringify(this.originalRules()),
    );
    this.saveMessage.set(null);
  }

  addSection(): void {
    const newSection: League.RuleSection = {
      title: 'New Section',
      body: '',
    };
    this.rules.set([...this.rules(), newSection]);
    this.onRuleChange();
  }

  deleteSection(index: number): void {
    const updatedRules = this.rules().filter((_, i) => i !== index);
    this.rules.set(updatedRules);
    this.onRuleChange();
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const rulesArray = [...this.rules()];
    [rulesArray[index - 1], rulesArray[index]] = [
      rulesArray[index],
      rulesArray[index - 1],
    ];
    this.rules.set(rulesArray);
    this.onRuleChange();
  }

  moveDown(index: number): void {
    const rulesArray = this.rules();
    if (index === rulesArray.length - 1) return;
    const updatedRules = [...rulesArray];
    [updatedRules[index], updatedRules[index + 1]] = [
      updatedRules[index + 1],
      updatedRules[index],
    ];
    this.rules.set(updatedRules);
    this.onRuleChange();
  }

  saveRules(): void {
    this.isSaving.set(true);
    this.leagueZoneService
      .saveRules(this.rules())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalRules.set(JSON.parse(JSON.stringify(this.rules())));
          this.hasUnsavedChanges.set(false);
          this.saveMessage.set({
            type: 'success',
            text: 'Rules saved successfully!',
          });
          this.isSaving.set(false);
          setTimeout(() => this.saveMessage.set(null), 3000);
        },
        error: (err) => {
          this.saveMessage.set({
            type: 'error',
            text: 'Failed to save rules. Please try again.',
          });
          this.isSaving.set(false);
          console.error('Error saving rules:', err);
        },
      });
  }

  canDeactivate(): boolean {
    if (this.hasUnsavedChanges()) {
      return confirm(
        'You have unsaved changes. Are you sure you want to leave? You will lose your progress.',
      );
    }
    return true;
  }
}
