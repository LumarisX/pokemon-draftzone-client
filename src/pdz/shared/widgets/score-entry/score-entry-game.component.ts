import { Component, input, model, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { ScoreEntryRosterComponent } from './score-entry-roster.component';
import { gameWinner, setGameWinner } from './score-entry.form';
import {
  SCORE_ENTRY_SIDES,
  ScoreEntryGameForm,
  ScoreEntryPokemon,
  ScoreEntrySide,
  isReplayUrl,
} from './score-entry.model';

@Component({
  selector: 'pdz-score-entry-game',
  templateUrl: './score-entry-game.component.html',
  styleUrl: './score-entry-game.component.scss',
  imports: [
    ButtonComponent,
    DisclosureComponent,
    IconComponent,
    InputDirective,
    ReactiveFormsModule,
    ScoreEntryRosterComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
})
export class ScoreEntryGameComponent {
  readonly game = input.required<ScoreEntryGameForm>();
  readonly sideNames = input.required<Record<ScoreEntrySide, string>>();
  readonly pokedex = input<Record<string, ScoreEntryPokemon>>({});
  readonly label = input('');
  readonly analyzing = input(false);
  readonly removable = input(true);
  readonly expectedRoster = input<number | undefined>(undefined);
  readonly open = model(true);

  readonly analyze = output<void>();
  readonly remove = output<void>();

  protected readonly sides = SCORE_ENTRY_SIDES;

  protected readonly accents: Record<ScoreEntrySide, 'primary' | 'secondary'> = {
    side1: 'primary',
    side2: 'secondary',
  };

  protected teamName(side: ScoreEntrySide): string {
    return this.sideNames()[side];
  }

  protected winner(): ScoreEntrySide | null {
    return gameWinner(this.game());
  }

  protected canAnalyze(): boolean {
    return !this.analyzing() && isReplayUrl(this.game().controls.link.value);
  }

  protected onWinner(side: ScoreEntrySide | null): void {
    setGameWinner(this.game(), side ?? null);
  }
}
