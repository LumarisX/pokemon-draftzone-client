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
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Subject, takeUntil } from 'rxjs';
import {
  ReplayAnalysis,
  ReplayPlayer,
} from '@pdz/features/tools/replay_analyzer/replay.interface';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { LeagueZoneService } from '../../league-zone.service';
import {
  MatchupDetail,
  MatchupReportPayload,
  MatchupSideKey,
} from '../league-matchup.model';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';

// Mirrors the server's REPLAY_URL_PATTERN (replay-analysis.controller.ts) so
// the button never enables for a link the server would reject anyway.
const REPLAY_URL_PATTERN = /^replay\.pokemonshowdown\.com\/.+$/i;

type PokemonStatus = 'brought' | 'survived' | 'fainted' | null;

type ReportMode = 'games' | 'forfeit' | 'score';

type PokemonStatsForm = FormGroup<{
  id: FormControl<string>;
  direct: FormControl<number>;
  indirect: FormControl<number>;
  teammate: FormControl<number>;
  status: FormControl<PokemonStatus>;
}>;

type GameForm = FormGroup<{
  link: FormControl<string>;
  winner: FormControl<MatchupSideKey | null>;
  team1Score: FormControl<number>;
  team2Score: FormControl<number>;
  /** True once the coach has typed into the score field directly, so status
   *  clicks stop overwriting it. */
  team1ScoreLocked: FormControl<boolean>;
  team2ScoreLocked: FormControl<boolean>;
  team1: FormArray<PokemonStatsForm>;
  team2: FormArray<PokemonStatsForm>;
}>;

type MatchupPokemonSummary = {
  key: string;
  name: string;
  kills: number;
  deaths: number;
};

@Component({
  selector: 'pdz-matchup-report',
  imports: [CommonModule, ReactiveFormsModule, IconComponent, SpriteComponent,
    InputDirective,
    ButtonComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    DisclosureComponent,
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
    games: FormArray<GameForm>;
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

  toggleSummary(): void {
    this.summaryOpen.update((open) => !open);
  }

  readonly statuses: { value: PokemonStatus; label: string }[] = [
    { value: null, label: 'Bench' },
    { value: 'brought', label: 'Brought' },
    { value: 'survived', label: 'Survived' },
    { value: 'fainted', label: 'Fainted' },
  ];

  readonly sides: MatchupSideKey[] = ['side1', 'side2'];

  readonly killFields: {
    field: 'direct' | 'indirect' | 'teammate';
    label: string;
  }[] = [
    { field: 'direct', label: 'Direct' },
    { field: 'indirect', label: 'Indirect' },
    { field: 'teammate', label: 'Team' },
  ];

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
                team1Score: game.team1.score,
                team2Score: game.team2.score,
                team1: game.team1.team,
                team2: game.team2.team,
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

  setMode(mode: ReportMode): void {
    this.mode.set(mode);
  }

  setForfeitWinner(side: MatchupSideKey): void {
    this.form.controls.forfeitWinner.setValue(
      this.form.controls.forfeitWinner.value === side ? null : side,
    );
  }

  get games(): FormArray<GameForm> {
    return this.form.controls.games;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get gameControls(): GameForm[] {
    return this.games.controls;
  }

  rosterControls(game: GameForm, side: MatchupSideKey): PokemonStatsForm[] {
    return side === 'side1'
      ? game.controls.team1.controls
      : game.controls.team2.controls;
  }

  nameOf(id: string): string {
    return getNameByPid(id) || id;
  }

  spriteFor(control: PokemonStatsForm) {
    const id = control.controls.id.value;
    return { id, name: this.nameOf(id) };
  }

  teamName(side: MatchupSideKey): string {
    return side === 'side1'
      ? this.matchup().team1.name
      : this.matchup().team2.name;
  }

  addGame(): void {
    this.games.push(this.buildGame());
  }

  removeGame(index: number): void {
    this.games.removeAt(index);
    if (!this.games.length) this.games.push(this.buildGame());
  }

  setStatus(
    control: PokemonStatsForm,
    status: PokemonStatus,
    game: GameForm,
    side: MatchupSideKey,
  ): void {
    control.controls.status.setValue(status);
    if (status === null) {
      control.controls.direct.setValue(0);
      control.controls.indirect.setValue(0);
      control.controls.teammate.setValue(0);
    }
    this.syncScore(game, side);
  }

  adjustKills(
    control: PokemonStatsForm,
    field: 'direct' | 'indirect' | 'teammate',
    delta: number,
    game: GameForm,
    side: MatchupSideKey,
  ): void {
    const next = Math.max(0, control.controls[field].value + delta);
    control.controls[field].setValue(next);
    const status = control.controls.status.value;
    if (next > 0 && (status === null || status === 'brought')) {
      control.controls.status.setValue('survived');
      this.syncScore(game, side);
    }
  }

  /** Recomputes a side's score from survivors, unless the coach has typed a
   *  manual value into that field directly. */
  private syncScore(game: GameForm, side: MatchupSideKey): void {
    const scoreControl =
      side === 'side1' ? game.controls.team1Score : game.controls.team2Score;
    const lockedControl =
      side === 'side1'
        ? game.controls.team1ScoreLocked
        : game.controls.team2ScoreLocked;
    if (lockedControl.value) return;
    scoreControl.setValue(this.survivors(game, side));
  }

  lockScore(game: GameForm, side: MatchupSideKey): void {
    const lockedControl =
      side === 'side1'
        ? game.controls.team1ScoreLocked
        : game.controls.team2ScoreLocked;
    lockedControl.setValue(true);
  }

  /** Clears a manual override and goes back to counting survivors. */
  resetScore(game: GameForm, side: MatchupSideKey): void {
    const lockedControl =
      side === 'side1'
        ? game.controls.team1ScoreLocked
        : game.controls.team2ScoreLocked;
    lockedControl.setValue(false);
    this.syncScore(game, side);
  }

  setWinner(game: GameForm, side: MatchupSideKey): void {
    game.controls.winner.setValue(
      game.controls.winner.value === side ? null : side,
    );
  }

  survivors(game: GameForm, side: MatchupSideKey): number {
    return this.rosterControls(game, side).filter(
      (control) => control.controls.status.value === 'survived',
    ).length;
  }

  seriesScore(side: MatchupSideKey): number {
    return this.gameControls.filter(
      (game) => game.controls.winner.value === side,
    ).length;
  }

  gameValidationWarnings(game: GameForm): string[] {
    const warnings: string[] = [];

    const team1 = game.controls.team1.controls;
    const team2 = game.controls.team2.controls;
    const brought = (roster: PokemonStatsForm[]) =>
      roster.filter((control) => control.controls.status.value !== null).length;
    const kills = (roster: PokemonStatsForm[]) =>
      roster.reduce(
        (sum, control) =>
          sum + control.controls.direct.value + control.controls.indirect.value,
        0,
      );
    const teamKills = (roster: PokemonStatsForm[]) =>
      roster.reduce((sum, control) => sum + control.controls.teammate.value, 0);
    const deaths = (roster: PokemonStatsForm[]) =>
      roster.reduce(
        (sum, control) =>
          sum + (control.controls.status.value === 'fainted' ? 1 : 0),
        0,
      );

    const team1Brought = brought(team1);
    const team2Brought = brought(team2);
    if (team1Brought !== 6) {
      warnings.push(`${this.teamName('side1')} has ${team1Brought} Pokémon`);
    }
    if (team2Brought !== 6) {
      warnings.push(`${this.teamName('side2')} has ${team2Brought} Pokémon`);
    }

    const team1Kills = kills(team1);
    const team2Kills = kills(team2);
    const team1Deaths = deaths(team1);
    const team2Deaths = deaths(team2);
    const team1TeamKills = teamKills(team1);
    const team2TeamKills = teamKills(team2);

    if (team1Kills !== team2Deaths - team2TeamKills) {
      warnings.push(
        `${this.teamName('side1')} kills (${team1Kills}) ≠ ${this.teamName('side2')} deaths (${team2Deaths - team2TeamKills})`,
      );
    }
    if (team2Kills !== team1Deaths - team1TeamKills) {
      warnings.push(
        `${this.teamName('side2')} kills (${team2Kills}) ≠ ${this.teamName('side1')} deaths (${team1Deaths - team1TeamKills})`,
      );
    }

    return warnings;
  }

  getPokemonSummary(side: MatchupSideKey): MatchupPokemonSummary[] {
    const totals = new Map<
      string,
      MatchupPokemonSummary & { hadStatus: boolean }
    >();

    this.gameControls.forEach((game) => {
      this.rosterControls(game, side).forEach((control) => {
        const id = control.controls.id.value;
        const status = control.controls.status.value;
        const existing = totals.get(id) ?? {
          key: id,
          name: this.nameOf(id),
          kills: 0,
          deaths: 0,
          hadStatus: false,
        };
        existing.kills +=
          control.controls.direct.value + control.controls.indirect.value;
        existing.deaths += status === 'fainted' ? 1 : 0;
        existing.hadStatus ||= status !== null;
        totals.set(id, existing);
      });
    });

    return [...totals.values()]
      .filter((summary) => summary.hadStatus)
      .map(({ key, name, kills, deaths }) => ({ key, name, kills, deaths }))
      .sort((a, b) => {
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

  isReplayUrl(url: string): boolean {
    const decoded = url.trim().replace(/^https?:\/\//i, '');
    return REPLAY_URL_PATTERN.test(decoded);
  }

  analyze(index: number): void {
    const game = this.gameControls[index];
    const url = game.controls.link.value.trim();
    if (!this.isReplayUrl(url) || this.analyzingIndex() !== null) return;

    this.analyzingIndex.set(index);
    this.analysisError.set(null);

    this.replayService
      .analyzeReplayV2(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.applyReplay(game, data.analysis);
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
        score: game.controls.team1Score.value,
        pokemon: this.rosterPayload(game, 'side1'),
      },
      team2: {
        score: game.controls.team2Score.value,
        pokemon: this.rosterPayload(game, 'side2'),
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

  private rosterPayload(game: GameForm, side: MatchupSideKey) {
    return this.rosterControls(game, side).reduce<
      Record<
        string,
        {
          kills: { direct: number; indirect: number; teammate: number };
          status: 'brought' | 'survived' | 'fainted';
        }
      >
    >((acc, control) => {
      const { id, status, direct, indirect, teammate } = control.getRawValue();
      if (status) acc[id] = { kills: { direct, indirect, teammate }, status };
      return acc;
    }, {});
  }

  private buildGame(seed?: {
    link?: string;
    winner: MatchupSideKey | null;
    team1Score?: number;
    team2Score?: number;
    team1: Record<
      string,
      {
        kills?: { direct?: number; indirect?: number; teammate?: number };
        status: 'brought' | 'survived' | 'fainted';
      }
    >;
    team2: Record<
      string,
      {
        kills?: { direct?: number; indirect?: number; teammate?: number };
        status: 'brought' | 'survived' | 'fainted';
      }
    >;
  }): GameForm {
    const team1 = this.matchup().team1.draft.map((pokemon) =>
      this.buildPokemon(pokemon.id, seed?.team1?.[pokemon.id]),
    );
    const team2 = this.matchup().team2.draft.map((pokemon) =>
      this.buildPokemon(pokemon.id, seed?.team2?.[pokemon.id]),
    );
    const survivorsOf = (roster: PokemonStatsForm[]) =>
      roster.filter((control) => control.controls.status.value === 'survived')
        .length;

    return this.fb.group({
      link: this.fb.control(seed?.link ?? '', { nonNullable: true }),
      winner: this.fb.control<MatchupSideKey | null>(seed?.winner ?? null),
      team1Score: this.fb.control(seed?.team1Score ?? survivorsOf(team1), {
        nonNullable: true,
      }),
      team2Score: this.fb.control(seed?.team2Score ?? survivorsOf(team2), {
        nonNullable: true,
      }),
      team1ScoreLocked: this.fb.control(seed?.team1Score !== undefined, {
        nonNullable: true,
      }),
      team2ScoreLocked: this.fb.control(seed?.team2Score !== undefined, {
        nonNullable: true,
      }),
      team1: this.fb.array(team1),
      team2: this.fb.array(team2),
    });
  }

  private buildPokemon(
    id: string,
    stats?: {
      kills?: { direct?: number; indirect?: number; teammate?: number };
      status: 'brought' | 'survived' | 'fainted';
    },
  ): PokemonStatsForm {
    return this.fb.group({
      id: this.fb.control(id, { nonNullable: true }),
      direct: this.fb.control(stats?.kills?.direct ?? 0, { nonNullable: true }),
      indirect: this.fb.control(stats?.kills?.indirect ?? 0, {
        nonNullable: true,
      }),
      teammate: this.fb.control(stats?.kills?.teammate ?? 0, {
        nonNullable: true,
      }),
      status: this.fb.control<PokemonStatus>(stats?.status ?? null),
    });
  }

  private applyReplay(game: GameForm, analysis: ReplayAnalysis): void {
    const players = analysis.players.slice(0, 2);
    if (players.length < 2) return;

    const team1Ids = new Set(this.matchup().team1.draft.map((mon) => mon.id));
    const team2Ids = new Set(this.matchup().team2.draft.map((mon) => mon.id));
    const overlap = (player: ReplayPlayer, ids: Set<string>) =>
      player.team.reduce(
        (count, mon) => (ids.has(mon.id) ? count + 1 : count),
        0,
      );

    const [first, second] = players;
    const straight =
      overlap(first, team1Ids) + overlap(second, team2Ids) >=
      overlap(first, team2Ids) + overlap(second, team1Ids);
    const side1Player = straight ? first : second;
    const side2Player = straight ? second : first;

    this.applyPlayer(game.controls.team1, side1Player);
    this.applyPlayer(game.controls.team2, side2Player);

    // Replay data is authoritative, so it overrides any manual score entry.
    game.controls.team1ScoreLocked.setValue(false);
    game.controls.team2ScoreLocked.setValue(false);
    game.controls.team1Score.setValue(this.survivors(game, 'side1'));
    game.controls.team2Score.setValue(this.survivors(game, 'side2'));

    game.controls.winner.setValue(
      side1Player.win ? 'side1' : side2Player.win ? 'side2' : null,
    );
  }

  private applyPlayer(
    roster: FormArray<PokemonStatsForm>,
    player: ReplayPlayer,
  ): void {
    roster.controls.forEach((control) =>
      control.patchValue({
        direct: 0,
        indirect: 0,
        teammate: 0,
        status: null,
      }),
    );

    const byId = new Map(
      roster.controls.map((control) => [control.controls.id.value, control]),
    );

    player.team.forEach((mon) => {
      const control = byId.get(mon.id);
      if (!control) return;
      control.patchValue({
        direct: mon.kills?.direct ?? 0,
        indirect: mon.kills?.indirect ?? 0,
        teammate: mon.kills?.teammate ?? 0,
        status: mon.status ?? null,
      });
    });
  }
}
