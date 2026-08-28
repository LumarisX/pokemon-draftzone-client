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
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ScoreEntryGameComponent } from '@pdz/shared/widgets/score-entry/score-entry-game.component';
import { ScoreEntryMatchComponent } from '@pdz/shared/widgets/score-entry/score-entry-match.component';
import { confirmScoreEntry } from '@pdz/shared/widgets/score-entry/score-entry-warnings-dialog.component';
import {
  applyReplayToGame,
  buildGameEntry,
  buildMatchEntry,
  carriedRosterSeed,
  gameWinner,
  inferredMatchScore,
  inferredMatchWinner,
  matchForfeitControl,
  matchForfeitedBy,
  matchScoreControl,
  matchScoreOf,
  resetMatchScore,
  resolvedMatchWinner,
  rosterPayload,
  scoreEntryWarnings,
  setMatchWinner,
  syncMatchScore,
  toggleMatchForfeit,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import {
  ScoreEntryGameForm,
  ScoreEntryGameSeed,
  ScoreEntryMatchForm,
  ScoreEntryPokemon,
  ScoreEntryRoster,
  ScoreEntrySide,
  ScoreEntryWarningGroup,
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
    LoadingComponent,
    ScoreEntryGameComponent,
    ScoreEntryMatchComponent,
  ],
})
export class OpponentScoreComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private draftService = inject(DraftService);
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialogs = inject(DialogService);
  private readonly destroy$ = new Subject<void>();

  readonly draftPath = DRAFT_OVERVIEW_PATH;

  teamId = '';
  matchupId = '';
  matchup?: Matchup;
  pokedex: Record<string, ScoreEntryPokemon> = {};

  form?: FormGroup<{
    match: ScoreEntryMatchForm;
    games: FormArray<ScoreEntryGameForm>;
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
      match: buildMatchEntry(this.fb, {
        side1Paste: matchup.aTeam.paste ?? '',
        side2Paste: matchup.bTeam.paste ?? '',
        score: override,
        winner:
          matchup.winnerOverride === 'a'
            ? 'side1'
            : matchup.winnerOverride === 'b'
              ? 'side2'
              : null,
        forfeit:
          matchup.forfeitedBy === 'a'
            ? 'side1'
            : matchup.forfeitedBy === 'b'
              ? 'side2'
              : matchup.forfeitedBy === 'both'
                ? 'both'
                : null,
      }),
      games: this.fb.array(games),
    });

    this.syncMatchScore();
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

  get match(): ScoreEntryMatchForm {
    return this.form!.controls.match;
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
    const previous = this.gameControls[this.gameControls.length - 1];
    this.games.push(
      this.buildGame(previous ? carriedRosterSeed(previous) : undefined),
    );
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
    return inferredMatchScore(this.gameControls);
  }

  matchScore(side: ScoreEntrySide): number {
    if (!this.form) return 0;
    return matchScoreOf(this.match, this.gameControls, side);
  }

  matchScoreControl(side: ScoreEntrySide): FormControl<number> {
    return matchScoreControl(this.match, side);
  }

  onMatchScoreInput(event: Event): void {
    if ((event.target as HTMLInputElement).value.trim() === '') return;
    this.match.controls.scoreLocked.setValue(true);
  }

  onMatchScoreBlur(side: ScoreEntrySide): void {
    const value = this.matchScoreControl(side).value;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      this.resetMatchScore();
    }
  }

  resetMatchScore(): void {
    resetMatchScore(this.match, this.gameControls);
  }

  syncMatchScore(): void {
    if (!this.form) return;
    syncMatchScore(this.match, this.gameControls);
  }

  inferredMatchWinner(): ScoreEntrySide | null {
    return inferredMatchWinner(this.match, this.gameControls);
  }

  matchWinner(): ScoreEntrySide | null {
    if (!this.form) return null;
    return resolvedMatchWinner(this.match, this.gameControls);
  }

  setMatchWinner(side: ScoreEntrySide | null): void {
    setMatchWinner(this.match, side);
  }

  clearMatchWinner(): void {
    this.match.controls.winner.setValue(null);
  }

  hasForfeited(side: ScoreEntrySide): boolean {
    return !!this.form && matchForfeitControl(this.match, side).value;
  }

  toggleForfeit(side: ScoreEntrySide): void {
    toggleMatchForfeit(this.match, side);
  }

  forfeitedBy(): ForfeitSide | null {
    const forfeited = matchForfeitedBy(this.match);
    if (forfeited === null) return null;
    return forfeited === 'both' ? 'both' : SIDE_OF[forfeited];
  }

  isForfeit(): boolean {
    return this.forfeitedBy() !== null;
  }

  isDoubleForfeit(): boolean {
    return this.forfeitedBy() === 'both';
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

  warnings(): ScoreEntryWarningGroup[] {
    if (!this.form) return [];
    return scoreEntryWarnings(this.match, this.gameControls, {
      sideNames: this.sideNames,
    });
  }

  async submit(): Promise<void> {
    if (!this.form || this.saving()) return;
    if (!(await confirmScoreEntry(this.dialogs, this.warnings(), 'Save anyway')))
      return;

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
    const match = this.match;
    const winner = match.controls.winner.value;

    return {
      aTeamPaste: match.controls.side1Paste.value,
      bTeamPaste: match.controls.side2Paste.value,
      matches: this.gameControls.map((game) => {
        const replay = game.controls.link.value.trim();
        const winner = gameWinner(game);
        return {
          aTeam: this.teamPayload(game, 'side1'),
          bTeam: this.teamPayload(game, 'side2'),
          ...(replay ? { replay } : {}),
          ...(winner ? { winner: SIDE_OF[winner] } : {}),
        };
      }),
      scoreOverride: match.controls.scoreLocked.value
        ? [match.controls.side1Score.value, match.controls.side2Score.value]
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
