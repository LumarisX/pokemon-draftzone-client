import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ScoreEntryGameComponent } from '@pdz/shared/widgets/score-entry/score-entry-game.component';
import {
  applyReplayToGame,
  buildGameEntry,
  rosterPayload,
  matchWins,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import {
  ScoreEntryGameForm,
  ScoreEntryGameSeed,
  ScoreEntryPokemon,
  ScoreEntryRoster,
  ScoreEntrySide,
} from '@pdz/shared/widgets/score-entry/score-entry.model';
import { Subject, takeUntil } from 'rxjs';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { DraftService } from '../../draft-overview/draft.service';
import { DraftPokemon } from '../../draft.model';
import {
  ForfeitSide,
  MatchSide,
  Matchup,
  Match,
  MatchTeam,
  ScorePatch,
  MatchStatTuple,
} from '../../matchup-overview/matchup.model';

const SIDE_OF: Record<ScoreEntrySide, MatchSide> = { side1: 'a', side2: 'b' };

@Component({
  selector: 'pdz-opponent-score',
  templateUrl: './opponent-score.component.html',
  styleUrl: './opponent-score.component.scss',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    InputDirective,
    LoadingComponent,
    ScoreEntryGameComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
})
export class OpponentScoreComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private draftService = inject(DraftService);
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly draftPath = DRAFT_OVERVIEW_PATH;
  readonly sides: ScoreEntrySide[] = ['side1', 'side2'];

  readonly accents: Record<ScoreEntrySide, 'primary' | 'secondary'> = {
    side1: 'primary',
    side2: 'secondary',
  };

  teamId = '';
  matchupId = '';
  matchup?: Matchup;
  pokedex: Record<string, ScoreEntryPokemon> = {};

  form?: FormGroup<{
    aTeamPaste: FormControl<string>;
    bTeamPaste: FormControl<string>;
    games: FormArray<ScoreEntryGameForm>;
    matchScore1: FormControl<number>;
    matchScore2: FormControl<number>;
    matchScoreLocked: FormControl<boolean>;
    matchWinner: FormControl<ScoreEntrySide | null>;
    forfeit1: FormControl<boolean>;
    forfeit2: FormControl<boolean>;
  }>;

  saving = signal(false);
  saveError = signal<string | null>(null);
  analyzingIndex = signal<number | null>(null);
  analysisError = signal<string | null>(null);
  openGames = signal<number[]>([0]);

  private rosterIds: Record<ScoreEntrySide, string[]> = {
    side1: [],
    side2: [],
  };
  private formeLookup = new Map<string, string>();

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamId') || '';
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (!('matchup' in params)) return;
        this.matchupId = params['matchup'];
        this.draftService
          .getMatchup(this.matchupId, this.teamId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.matchup = data;
            this.initForm(data);
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(matchup: Matchup): void {
    this.indexTeams(matchup);

    const games = matchup.matches.length
      ? matchup.matches.map((match) => this.buildGame(this.seedFrom(match)))
      : [this.buildGame()];

    const override = matchup.scoreOverride ?? null;

    this.form = this.fb.group({
      aTeamPaste: this.fb.control(matchup.aTeam.paste ?? '', {
        nonNullable: true,
      }),
      bTeamPaste: this.fb.control(matchup.bTeam.paste ?? '', {
        nonNullable: true,
      }),
      games: this.fb.array(games),
      matchScore1: this.fb.control(override?.[0] ?? 0, { nonNullable: true }),
      matchScore2: this.fb.control(override?.[1] ?? 0, { nonNullable: true }),
      matchScoreLocked: this.fb.control(override !== null, {
        nonNullable: true,
      }),
      matchWinner: this.fb.control<ScoreEntrySide | null>(
        matchup.winnerOverride === 'a'
          ? 'side1'
          : matchup.winnerOverride === 'b'
            ? 'side2'
            : null,
      ),
      forfeit1: this.fb.control(
        matchup.forfeitedBy === 'a' || matchup.forfeitedBy === 'both',
        { nonNullable: true },
      ),
      forfeit2: this.fb.control(
        matchup.forfeitedBy === 'b' || matchup.forfeitedBy === 'both',
        { nonNullable: true },
      ),
    });

    if (override === null) this.syncMatchScore();

    this.form.controls.games.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncMatchScore());
  }

  private indexTeams(matchup: Matchup): void {
    this.pokedex = {};
    this.formeLookup = new Map();
    const index = (team: DraftPokemon[]) => {
      team.forEach((pokemon) => {
        this.pokedex[pokemon.id] = pokemon;
        this.formeLookup.set(pokemon.id, pokemon.id);
        pokemon.draftFormes?.forEach((forme) =>
          this.formeLookup.set(forme.id, pokemon.id),
        );
      });
      return team.map((pokemon) => pokemon.id);
    };
    this.rosterIds = {
      side1: index(matchup.aTeam.team),
      side2: index(matchup.bTeam.team),
    };
  }

  private buildGame(seed?: ScoreEntryGameSeed): ScoreEntryGameForm {
    return buildGameEntry(this.fb, this.rosterIds, seed);
  }

  private seedFrom(match: Match): ScoreEntryGameSeed {
    return {
      link: match.replay ?? '',
      winner:
        match.winner === 'a' ? 'side1' : match.winner === 'b' ? 'side2' : null,
      side1Score: match.aTeam?.score,
      side2Score: match.bTeam?.score,
      side1: this.rosterFrom(match.aTeam),
      side2: this.rosterFrom(match.bTeam),
    };
  }

  private rosterFrom(team?: MatchTeam): ScoreEntryRoster {
    return (team?.stats ?? []).reduce<ScoreEntryRoster>((acc, [id, stat]) => {
      acc[id] = {
        kills: {
          direct: stat.kills ?? 0,
          indirect: stat.indirect ?? 0,
          teammate: stat.teammate ?? 0,
        },
        status:
          stat.status ??
          (stat.deaths ? 'fainted' : stat.brought ? 'survived' : 'brought'),
      };
      return acc;
    }, {});
  }

  get games(): FormArray<ScoreEntryGameForm> {
    return this.form!.controls.games;
  }

  get gameControls(): ScoreEntryGameForm[] {
    return this.games.controls;
  }

  teamName(side: ScoreEntrySide): string {
    const matchup = this.matchup;
    if (!matchup) return '';
    return side === 'side1' ? matchup.aTeam.teamName : matchup.bTeam.teamName;
  }

  get sideNames(): Record<ScoreEntrySide, string> {
    return { side1: this.teamName('side1'), side2: this.teamName('side2') };
  }

  addGame(): void {
    this.games.push(this.buildGame());
    this.openGames.set([this.games.length - 1]);
    this.syncMatchScore();
  }

  removeGame(index: number): void {
    this.games.removeAt(index);
    if (!this.games.length) this.games.push(this.buildGame());
    this.openGames.update((open) =>
      open.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
    );
    this.syncMatchScore();
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

  inferredMatchScore(): [number, number] {
    const games = this.gameControls;
    if (games.length === 1) {
      return [
        games[0].controls.side1Score.value,
        games[0].controls.side2Score.value,
      ];
    }
    return [matchWins(games, 'side1'), matchWins(games, 'side2')];
  }

  matchScore(side: ScoreEntrySide): number {
    const form = this.form;
    if (!form) return 0;
    if (form.controls.matchScoreLocked.value) {
      return side === 'side1'
        ? form.controls.matchScore1.value
        : form.controls.matchScore2.value;
    }
    const inferred = this.inferredMatchScore();
    return side === 'side1' ? inferred[0] : inferred[1];
  }

  isMatchScoreLocked(): boolean {
    return !!this.form?.controls.matchScoreLocked.value;
  }

  matchScoreControl(side: ScoreEntrySide): FormControl<number> {
    return side === 'side1'
      ? this.form!.controls.matchScore1
      : this.form!.controls.matchScore2;
  }

  pasteControl(side: ScoreEntrySide): FormControl<string> {
    return side === 'side1'
      ? this.form!.controls.aTeamPaste
      : this.form!.controls.bTeamPaste;
  }

  onMatchScoreInput(event: Event): void {
    if ((event.target as HTMLInputElement).value.trim() === '') return;
    this.form?.controls.matchScoreLocked.setValue(true);
  }

  onMatchScoreBlur(side: ScoreEntrySide): void {
    const value = this.matchScoreControl(side).value;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      this.resetMatchScore();
    }
  }

  resetMatchScore(): void {
    this.form?.controls.matchScoreLocked.setValue(false);
    this.syncMatchScore();
  }

  syncMatchScore(): void {
    const form = this.form;
    if (!form || form.controls.matchScoreLocked.value) return;
    const [side1, side2] = this.inferredMatchScore();
    form.controls.matchScore1.setValue(side1);
    form.controls.matchScore2.setValue(side2);
  }

  inferredMatchWinner(): ScoreEntrySide | null {
    const [side1, side2] = [this.matchScore('side1'), this.matchScore('side2')];
    if (side1 > side2) return 'side1';
    if (side2 > side1) return 'side2';
    return null;
  }

  matchWinner(): ScoreEntrySide | null {
    const forfeited = this.forfeitedBy();
    if (forfeited === 'both') return null;
    if (forfeited === 'a') return 'side2';
    if (forfeited === 'b') return 'side1';
    return this.form?.controls.matchWinner.value ?? this.inferredMatchWinner();
  }

  isMatchWinnerOverridden(): boolean {
    return this.form?.controls.matchWinner.value !== null;
  }

  setMatchWinner(side: ScoreEntrySide | null): void {
    if (side && !this.isForfeit()) {
      this.form?.controls.matchWinner.setValue(side);
    }
  }

  clearMatchWinner(): void {
    this.form?.controls.matchWinner.setValue(null);
  }

  forfeitControl(side: ScoreEntrySide): FormControl<boolean> {
    return side === 'side1'
      ? this.form!.controls.forfeit1
      : this.form!.controls.forfeit2;
  }

  hasForfeited(side: ScoreEntrySide): boolean {
    return !!this.form && this.forfeitControl(side).value;
  }

  toggleForfeit(side: ScoreEntrySide): void {
    const control = this.forfeitControl(side);
    control.setValue(!control.value);
  }

  forfeitedBy(): ForfeitSide | null {
    const side1 = this.hasForfeited('side1');
    const side2 = this.hasForfeited('side2');
    if (side1 && side2) return 'both';
    if (side1) return 'a';
    if (side2) return 'b';
    return null;
  }

  isForfeit(): boolean {
    return this.forfeitedBy() !== null;
  }

  isDoubleForfeit(): boolean {
    return this.forfeitedBy() === 'both';
  }

  //Empty intentionally. May add match warning in the future if a good use case is found.
  matchWarnings(): string[] {
    const warnings: string[] = [];
    return warnings;
  }

  analyze(index: number): void {
    if (this.analyzingIndex() !== null) return;
    const game = this.gameControls[index];

    this.analyzingIndex.set(index);
    this.analysisError.set(null);

    this.replayService
      .analyzeReplayV2(game.controls.link.value.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const applied = applyReplayToGame(
            game,
            data.analysis.players,
            {
              side1: this.formeSet('side1'),
              side2: this.formeSet('side2'),
            },
            (replayId) => this.formeLookup.get(replayId),
          );
          if (!applied) {
            this.analysisError.set('That replay does not have two players.');
          }
          this.syncMatchScore();
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

  private formeSet(side: ScoreEntrySide): Set<string> {
    const ids = new Set(this.rosterIds[side]);
    this.formeLookup.forEach((ownerId, formeId) => {
      if (ids.has(ownerId)) ids.add(formeId);
    });
    return ids;
  }

  submit(): void {
    if (!this.form || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);

    this.draftService
      .scoreMatchup(this.matchupId, this.teamId, this.buildPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/', this.draftPath, this.teamId]);
        },
        error: (error) => {
          this.saving.set(false);
          this.saveError.set(error?.message || 'Could not save the score.');
        },
      });
  }

  private buildPayload(): ScorePatch {
    const form = this.form!;
    const winner = form.controls.matchWinner.value;

    return {
      aTeamPaste: form.controls.aTeamPaste.value,
      bTeamPaste: form.controls.bTeamPaste.value,
      matches: this.gameControls.map((game) => {
        const replay = game.controls.link.value.trim();
        const gameWinner = game.controls.winner.value;
        return {
          aTeam: this.teamPayload(game, 'side1'),
          bTeam: this.teamPayload(game, 'side2'),
          ...(replay ? { replay } : {}),
          ...(gameWinner ? { winner: SIDE_OF[gameWinner] } : {}),
        };
      }),
      scoreOverride: form.controls.matchScoreLocked.value
        ? [form.controls.matchScore1.value, form.controls.matchScore2.value]
        : null,
      winnerOverride: winner ? SIDE_OF[winner] : null,
      forfeitedBy: this.forfeitedBy(),
    };
  }

  private teamPayload(
    game: ScoreEntryGameForm,
    side: ScoreEntrySide,
  ): MatchTeam {
    const roster = rosterPayload(game, side);
    const stats: MatchStatTuple[] = Object.entries(roster).map(
      ([id, entry]) => [
        id,
        {
          kills: entry.kills?.direct ?? 0,
          indirect: entry.kills?.indirect ?? 0,
          teammate: entry.kills?.teammate ?? 0,
          status: entry.status,
        },
      ],
    );
    return {
      stats,
      score:
        side === 'side1'
          ? game.controls.side1Score.value
          : game.controls.side2Score.value,
    };
  }
}
