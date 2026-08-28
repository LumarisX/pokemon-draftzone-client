import { Component, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, startWith, switchMap } from 'rxjs';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import {
  forfeitNeedsReason,
  matchForfeitControl,
  matchForfeitedBy,
  matchPasteControl,
  matchScoreControl,
  resetMatchScore,
  resolvedMatchWinner,
  setMatchWinner,
  syncMatchScore,
  toggleMatchForfeit,
} from './score-entry.form';
import {
  SCORE_ENTRY_SIDES,
  ScoreEntryGameForm,
  ScoreEntryMatchForm,
  ScoreEntrySide,
} from './score-entry.model';

@Component({
  selector: 'pdz-score-entry-match',
  templateUrl: './score-entry-match.component.html',
  styleUrl: './score-entry-match.component.scss',
  imports: [
    ButtonComponent,
    InputDirective,
    ReactiveFormsModule,
    SelectComponent,
    SelectOptionComponent,
  ],
})
export class ScoreEntryMatchComponent {
  readonly match = input.required<ScoreEntryMatchForm>();
  readonly sideNames = input.required<Record<ScoreEntrySide, string>>();
  readonly games = input<FormArray<ScoreEntryGameForm> | null>(null);
  readonly notes = input<FormControl<string> | null>(null);
  readonly notesLabel = input('Notes (optional)');
  readonly notesPlaceholder = input('Anything worth recording…');

  protected readonly sides = SCORE_ENTRY_SIDES;

  protected readonly accents: Record<ScoreEntrySide, 'primary' | 'secondary'> = {
    side1: 'primary',
    side2: 'secondary',
  };

  constructor() {
    toObservable(this.games)
      .pipe(
        switchMap((games) =>
          games ? games.valueChanges.pipe(startWith(null)) : EMPTY,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => syncMatchScore(this.match(), this.gameControls()));
  }

  protected gameControls(): ScoreEntryGameForm[] {
    return this.games()?.controls ?? [];
  }

  protected teamName(side: ScoreEntrySide): string {
    return this.sideNames()[side];
  }

  protected pasteControl(side: ScoreEntrySide): FormControl<string> {
    return matchPasteControl(this.match(), side);
  }

  protected scoreControl(side: ScoreEntrySide): FormControl<number> {
    return matchScoreControl(this.match(), side);
  }

  protected hasForfeited(side: ScoreEntrySide): boolean {
    return matchForfeitControl(this.match(), side).value;
  }

  protected isForfeit(): boolean {
    return this.sides.some((side) => this.hasForfeited(side));
  }

  protected winner(): ScoreEntrySide | null {
    return resolvedMatchWinner(this.match(), this.gameControls());
  }

  protected forfeitCaption(): string | null {
    const forfeited = matchForfeitedBy(this.match());
    if (!forfeited) return null;
    if (forfeited === 'both') return 'Double forfeit — a loss for both';
    return `Wins by forfeit — games ignored`;
  }

  protected reasonMissing(): boolean {
    return forfeitNeedsReason(this.match(), this.notes());
  }

  protected notesText(): string {
    return this.isForfeit()
      ? 'Why did this end in a forfeit? (required)'
      : this.notesLabel();
  }

  protected notesHint(): string {
    return this.isForfeit()
      ? 'Explain what happened — the organizers see this with the result.'
      : this.notesPlaceholder();
  }

  protected onScoreInput(event: Event): void {
    if ((event.target as HTMLInputElement).value.trim() === '') return;
    this.match().controls.scoreLocked.setValue(true);
  }

  protected onScoreBlur(side: ScoreEntrySide): void {
    const value = this.scoreControl(side).value;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      resetMatchScore(this.match(), this.gameControls());
    }
  }

  protected onWinner(side: ScoreEntrySide | null): void {
    setMatchWinner(this.match(), side);
  }

  protected onForfeit(side: ScoreEntrySide): void {
    toggleMatchForfeit(this.match(), side);
  }
}
