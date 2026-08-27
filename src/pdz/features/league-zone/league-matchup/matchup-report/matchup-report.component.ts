import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  signal,
  input,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { Subject, takeUntil } from 'rxjs';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { LeagueZoneService } from '../../league-zone.service';
import {
  MatchupDetail,
  MatchupReportPayload,
  MatchupSideKey,
} from '../league-matchup.model';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { ScoreEntryGameComponent } from '@pdz/shared/widgets/score-entry/score-entry-game.component';
import {
  applyReplayToGame,
  buildGameEntry,
  rosterEntries,
  rosterPayload,
  matchWins,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import {
  SCORE_ENTRY_SIDES,
  ScoreEntryGameForm,
  ScoreEntrySide,
} from '@pdz/shared/widgets/score-entry/score-entry.model';

type ReportMode = 'games' | 'forfeit' | 'score';

type MatchupPokemonSummary = {
  key: string;
  name: string;
  kills: number;
  deaths: number;
};

const ROSTER_SIZE = 6;

@Component({
  selector: 'pdz-matchup-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    InputDirective,
    ButtonComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    DisclosureComponent,
    ScoreEntryGameComponent,
  ],
  templateUrl: './matchup-report.component.html',
  styleUrl: './matchup-report.component.scss',
})
export class MatchupReportComponent implements OnInit, OnDestroy {
  readonly matchup = input.required<MatchupDetail>();
  readonly matchupSlug = input.required<string>();

  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private leagueService = inject(LeagueZoneService);
  private replayService = inject(ReplayService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup<{
    games: FormArray<ScoreEntryGameForm>;
    forfeitWinner: FormControl<MatchupSideKey | null>;
    manualScoreTeam1: FormControl<number>;
    manualScoreTeam2: FormControl<number>;
    notes: FormControl<string>;
  }>;

  saving = signal(false);
  saveError = signal<string | null>(null);
  analyzingIndex = signal<number | null>(null);
  analysisError = signal<string | null>(null);
  mode = signal<ReportMode>('games');
  summaryOpen = signal(false);
  openGames = signal<number[]>([0]);

  readonly sides = SCORE_ENTRY_SIDES;
  readonly rosterSize = ROSTER_SIZE;

  toggleSummary(): void {
    this.summaryOpen.update((open) => !open);
  }

  ngOnInit(): void {
    const matchup = this.matchup();
    const seed = matchup.report?.matches.length
      ? matchup.report.matches
      : matchup.matches;
    this.form = this.fb.group({
      games: this.fb.array(
        seed.length
          ? seed.map((game) =>
              this.buildGame({
                link: game.link,
                winner: game.team1.winner
                  ? 'side1'
                  : game.team2.winner
                    ? 'side2'
                    : null,
                side1Score: game.team1.score,
                side2Score: game.team2.score,
                side1: game.team1.team,
                side2: game.team2.team,
              }),
            )
          : [this.buildGame()],
      ),
      forfeitWinner: this.fb.control<MatchupSideKey | null>(null),
      manualScoreTeam1: this.fb.control(0, { nonNullable: true }),
      manualScoreTeam2: this.fb.control(0, { nonNullable: true }),
      notes: this.fb.control(this.matchup().report?.notes ?? '', {
        nonNullable: true,
      }),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setMode(mode: ReportMode): void {
    this.mode.set(mode);
  }

  setForfeitWinner(side: MatchupSideKey): void {
    this.form.controls.forfeitWinner.setValue(
      this.form.controls.forfeitWinner.value === side ? null : side,
    );
  }

  get games(): FormArray<ScoreEntryGameForm> {
    return this.form.controls.games;
  }

  get gameControls(): ScoreEntryGameForm[] {
    return this.games.controls;
  }

  nameOf(id: string): string {
    return getNameByPid(id) || id;
  }

  teamName(side: ScoreEntrySide): string {
    return side === 'side1'
      ? this.matchup().team1.name
      : this.matchup().team2.name;
  }

  get sideNames(): Record<ScoreEntrySide, string> {
    return { side1: this.teamName('side1'), side2: this.teamName('side2') };
  }

  addGame(): void {
    this.games.push(this.buildGame());
    this.openGames.set([this.games.length - 1]);
  }

  removeGame(index: number): void {
    this.games.removeAt(index);
    if (!this.games.length) this.games.push(this.buildGame());
    this.openGames.update((open) =>
      open.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
    );
  }

  isGameOpen(index: number): boolean {
    return this.openGames().includes(index);
  }

  setGameOpen(index: number, open: boolean): void {
    this.openGames.update((current) =>
      open
        ? [...new Set([...current, index])]
        : current.filter((i) => i !== index),
    );
  }

  seriesScore(side: ScoreEntrySide): number {
    return matchWins(this.gameControls, side);
  }

  getPokemonSummary(side: ScoreEntrySide): MatchupPokemonSummary[] {
    const totals = new Map<string, MatchupPokemonSummary>();

    this.gameControls.forEach((game) => {
      rosterEntries(game, side).forEach((entry) => {
        const { id, status, direct, indirect } = entry.getRawValue();
        if (!status) return;
        const existing = totals.get(id) ?? {
          key: id,
          name: this.nameOf(id),
          kills: 0,
          deaths: 0,
        };
        existing.kills += direct + indirect;
        existing.deaths += status === 'fainted' ? 1 : 0;
        totals.set(id, existing);
      });
    });

    return [...totals.values()].sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      return a.name.localeCompare(b.name);
    });
  }

  get incompleteGames(): number[] {
    return this.gameControls
      .map((game, index) => (game.controls.winner.value ? -1 : index + 1))
      .filter((value) => value > 0);
  }

  get canSubmit(): boolean {
    if (this.saving()) return false;
    switch (this.mode()) {
      case 'forfeit':
        return this.form.controls.forfeitWinner.value !== null;
      case 'score':
        return true;
      default:
        return this.incompleteGames.length === 0;
    }
  }

  analyze(index: number): void {
    const game = this.gameControls[index];
    const url = game.controls.link.value.trim();
    if (this.analyzingIndex() !== null) return;

    this.analyzingIndex.set(index);
    this.analysisError.set(null);

    this.replayService
      .analyzeReplayV2(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const applied = applyReplayToGame(game, data.analysis.players, {
            side1: new Set(this.matchup().team1.draft.map((mon) => mon.id)),
            side2: new Set(this.matchup().team2.draft.map((mon) => mon.id)),
          });
          if (!applied) {
            this.analysisError.set('That replay does not have two players.');
          }
          this.analyzingIndex.set(null);
        },
        error: (error) => {
          this.analyzingIndex.set(null);
          this.analysisError.set(
            error?.message || 'Could not read that replay.',
          );
        },
      });
  }

  submit(): void {
    if (!this.canSubmit) return;

    this.saving.set(true);
    this.saveError.set(null);

    this.leagueService
      .submitMatchupReport(this.matchupSlug(), this.buildPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.submitted.emit();
        },
        error: (error) => {
          this.saving.set(false);
          this.saveError.set(error?.message || 'Failed to submit the result.');
        },
      });
  }

  private buildPayload(): MatchupReportPayload {
    const notes = this.form.controls.notes.value.trim() || undefined;

    if (this.mode() === 'forfeit') {
      const winner = this.form.controls.forfeitWinner.value as MatchupSideKey;
      return { winner, forfeit: true, matches: [], notes };
    }

    if (this.mode() === 'score') {
      const score = {
        team1: this.form.controls.manualScoreTeam1.value,
        team2: this.form.controls.manualScoreTeam2.value,
      };
      return {
        score,
        winner:
          score.team1 > score.team2
            ? 'side1'
            : score.team2 > score.team1
              ? 'side2'
              : 'draw',
        matches: [],
        notes,
      };
    }

    const matches = this.gameControls.map((game) => ({
      link: game.controls.link.value.trim() || undefined,
      winner: game.controls.winner.value as MatchupSideKey,
      team1: {
        score: game.controls.side1Score.value,
        pokemon: rosterPayload(game, 'side1'),
      },
      team2: {
        score: game.controls.side2Score.value,
        pokemon: rosterPayload(game, 'side2'),
      },
    }));

    const score = {
      team1: this.seriesScore('side1'),
      team2: this.seriesScore('side2'),
    };

    return {
      score,
      winner:
        score.team1 > score.team2
          ? 'side1'
          : score.team2 > score.team1
            ? 'side2'
            : 'draw',
      matches,
      notes,
    };
  }

  private buildGame(seed?: Parameters<typeof buildGameEntry>[2]) {
    return buildGameEntry(
      this.fb,
      {
        side1: this.matchup().team1.draft.map((pokemon) => pokemon.id),
        side2: this.matchup().team2.draft.map((pokemon) => pokemon.id),
      },
      seed,
    );
  }
}
