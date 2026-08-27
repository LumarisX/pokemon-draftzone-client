import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import {
  adjustKills,
  lockScore,
  rosterEntries,
  scoreControl,
  setKills,
  setPokemonStatus,
  survivors,
  unlockScore,
} from './score-entry.form';
import {
  SCORE_ENTRY_KILL_FIELDS,
  SCORE_ENTRY_STATUSES,
  ScoreEntryGameForm,
  ScoreEntryKillField,
  ScoreEntryPokemon,
  ScoreEntryPokemonForm,
  ScoreEntrySide,
  ScoreEntryStatus,
} from './score-entry.model';

@Component({
  selector: 'pdz-score-entry-roster',
  templateUrl: './score-entry-roster.component.html',
  styleUrl: './score-entry-roster.component.scss',
  imports: [
    ButtonComponent,
    IconComponent,
    InputDirective,
    ReactiveFormsModule,
    SelectComponent,
    SelectOptionComponent,
    SpriteComponent,
  ],
})
export class ScoreEntryRosterComponent {
  readonly game = input.required<ScoreEntryGameForm>();
  readonly side = input.required<ScoreEntrySide>();
  readonly teamName = input('');
  readonly pokedex = input<Record<string, ScoreEntryPokemon>>({});
  readonly accent = input<'primary' | 'secondary' | 'neutral'>('neutral');

  protected readonly statuses = SCORE_ENTRY_STATUSES;
  protected readonly killFields = SCORE_ENTRY_KILL_FIELDS;

  protected readonly entries = computed(() =>
    rosterEntries(this.game(), this.side()),
  );

  protected readonly facingRight = computed(() => this.side() === 'side1');

  protected readonly score = computed(() =>
    scoreControl(this.game(), this.side()),
  );

  protected alive(): number {
    return survivors(this.game(), this.side());
  }

  protected spriteFor(entry: ScoreEntryPokemonForm): ScoreEntryPokemon {
    const id = entry.controls.id.value;
    return this.pokedex()[id] ?? { id, name: getNameByPid(id) || id };
  }

  protected nameOf(entry: ScoreEntryPokemonForm): string {
    return this.spriteFor(entry).name;
  }

  protected onScoreInput(event: Event): void {
    if ((event.target as HTMLInputElement).value.trim() === '') return;
    lockScore(this.game(), this.side());
  }

  protected onScoreBlur(): void {
    const value = this.score().value;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      unlockScore(this.game(), this.side());
    }
  }

  protected onStatus(
    entry: ScoreEntryPokemonForm,
    status: ScoreEntryStatus | null,
  ): void {
    setPokemonStatus(entry, status, this.game(), this.side());
  }

  protected onStep(
    entry: ScoreEntryPokemonForm,
    field: ScoreEntryKillField,
    delta: number,
  ): void {
    adjustKills(entry, field, delta, this.game(), this.side());
  }

  protected onKillBlur(
    entry: ScoreEntryPokemonForm,
    field: ScoreEntryKillField,
  ): void {
    setKills(entry, field, entry.controls[field].value, this.game(), this.side());
  }
}
