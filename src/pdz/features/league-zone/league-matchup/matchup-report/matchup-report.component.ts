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
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { ScoreEntryGameComponent } from '@pdz/shared/widgets/score-entry/score-entry-game.component';
import { ScoreEntryMatchComponent } from '@pdz/shared/widgets/score-entry/score-entry-match.component';
import { confirmScoreEntry } from '@pdz/shared/widgets/score-entry/score-entry-warnings-dialog.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  applyReplayToGame,
  buildGameEntry,
  buildMatchEntry,
  carriedRosterSeed,
  forfeitNeedsReason,
  gameWinner,
  isGameEmpty,
  isMatchForfeit,
  matchForfeitedBy,
  matchScoreOf,
  resolvedMatchWinner,
  rosterEntries,
  rosterPayload,
  scoreEntryWarnings,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import {
  SCORE_ENTRY_SIDES,
  ScoreEntryGameForm,
  ScoreEntryMatchForm,
  ScoreEntrySide,
  ScoreEntryWarningGroup,
} from '@pdz/shared/widgets/score-entry/score-entry.model';

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
    ReactiveFormsModule,
    IconComponent,
    ButtonComponent,
    DisclosureComponent,
    ScoreEntryGameComponent,
    ScoreEntryMatchComponent,
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
  private dialogs = inject(DialogService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup<{
    match: ScoreEntryMatchForm;
    games: FormArray<ScoreEntryGameForm>;
    notes: FormControl<string>;
  }>;

  saving = signal(false);
  saveError = signal<string | null>(null);
  analyzingIndex = signal<number | null>(null);
  analysisError = signal<string | null>(null);
  summaryOpen = signal(false);
  openGames = signal<number[]>([0]);

  readonly sides = SCORE_ENTRY_SIDES;
  readonly rosterSize = ROSTER_SIZE;

  toggleSummary(): void {
    this.summaryOpen.update((open) => !open);
  }

  ngOnInit(): void {
    const matchup = this.matchup();
    const report = matchup.report;
    const seed = report?.matches.length ? report.matches : matchup.matches;

    this.form = this.fb.group({
      match: buildMatchEntry(this.fb, {
        side1Paste: report?.side1Paste ?? matchup.team1.paste ?? '',
        side2Paste: report?.side2Paste ?? matchup.team2.paste ?? '',
        score: report ? [report.score.team1, report.score.team2] : null,
        winner:
          report?.winner === 'side1' || report?.winner === 'side2'
            ? report.winner
            : null,
        forfeit: this.seedForfeit(),
      }),
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
      notes: this.fb.control(report?.notes ?? '', { nonNullable: true }),
    });
  }

  private seedForfeit(): 'side1' | 'side2' | 'both' | null {
    const report = this.matchup().report;
    if (!report?.forfeit) return null;
    if (report.winner === 'side1') return 'side2';
    if (report.winner === 'side2') return 'side1';
    return 'both';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get match(): ScoreEntryMatchForm {
    return this.form.controls.match;
  }

  get games(): FormArray<ScoreEntryGameForm> {
    return this.form.controls.games;
  }

  get gameControls(): ScoreEntryGameForm[] {
    return this.games.controls;
  }

  get notesControl(): FormControl<string> {
    return this.form.controls.notes;
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

  isForfeit(): boolean {
    return isMatchForfeit(this.match);
  }

  addGame(): void {
    const previous = this.gameControls[this.gameControls.length - 1];
    this.games.push(
      this.buildGame(previous ? carriedRosterSeed(previous) : undefined),
    );
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
    return matchScoreOf(this.match, this.gameControls, side);
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

  get playedGames(): ScoreEntryGameForm[] {
    if (this.isForfeit()) return [];
    return this.gameControls.filter((game) => !isGameEmpty(game));
  }

  get needsForfeitReason(): boolean {
    return forfeitNeedsReason(this.match, this.notesControl);
  }

  get canSubmit(): boolean {
    if (this.saving()) return false;
    return !this.needsForfeitReason;
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

  warnings(): ScoreEntryWarningGroup[] {
    return scoreEntryWarnings(this.match, this.gameControls, {
      sideNames: this.sideNames,
      expectedRoster: this.rosterSize,
    });
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) return;
    if (
      !(await confirmScoreEntry(
        this.dialogs,
        this.warnings(),
        'Submit anyway',
      ))
    )
      return;

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
    const forfeit = matchForfeitedBy(this.match);
    const winner = resolvedMatchWinner(this.match, this.gameControls);

    const matches = this.playedGames.map((game) => ({
      link: game.controls.link.value.trim() || undefined,
      winner: (gameWinner(game) ?? 'draw') as MatchupSideKey | 'draw',
      team1: {
        score: game.controls.side1Score.value,
        pokemon: rosterPayload(game, 'side1'),
      },
      team2: {
        score: game.controls.side2Score.value,
        pokemon: rosterPayload(game, 'side2'),
      },
    }));

    return {
      score: {
        team1: this.seriesScore('side1'),
        team2: this.seriesScore('side2'),
      },
      winner: winner ?? 'draw',
      ...(forfeit ? { forfeit: true } : {}),
      matches,
      notes: this.notesControl.value.trim() || undefined,
      side1Paste: this.match.controls.side1Paste.value.trim() || undefined,
      side2Paste: this.match.controls.side2Paste.value.trim() || undefined,
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
