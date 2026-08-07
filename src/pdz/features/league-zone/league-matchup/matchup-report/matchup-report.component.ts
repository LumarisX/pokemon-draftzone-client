import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { getNameByPid, PokemonId } from '@pdz/shared/data/namedex';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Subject, takeUntil } from 'rxjs';
import {
  ReplayAnalysis,
  ReplayPlayer,
} from '../../../tools/replay_analyzer/replay.interface';
import { ReplayService } from '../../../tools/replay_analyzer/replay.service';
import { LeagueZoneService } from '../../league-zone.service';
import {
  MatchupDetail,
  MatchupReportPayload,
  MatchupSideKey,
} from '../league-matchup.model';

type PokemonStatus = 'brought' | 'survived' | 'fainted' | null;

type PokemonStatsForm = FormGroup<{
  id: FormControl<PokemonId>;
  direct: FormControl<number>;
  indirect: FormControl<number>;
  teammate: FormControl<number>;
  status: FormControl<PokemonStatus>;
}>;

type GameForm = FormGroup<{
  link: FormControl<string>;
  winner: FormControl<MatchupSideKey | null>;
  team1: FormArray<PokemonStatsForm>;
  team2: FormArray<PokemonStatsForm>;
}>;

@Component({
  selector: 'pdz-matchup-report',
  imports: [CommonModule, ReactiveFormsModule, IconComponent, SpriteComponent],
  templateUrl: './matchup-report.component.html',
  styleUrl: './matchup-report.component.scss',
})
export class MatchupReportComponent implements OnInit, OnDestroy {
  @Input({ required: true }) matchup!: MatchupDetail;
  @Input({ required: true }) stageId!: string;
  @Input({ required: true }) matchupId!: string;

  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private leagueService = inject(LeagueZoneService);
  private replayService = inject(ReplayService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup<{ games: FormArray<GameForm> }>;

  saving = signal(false);
  saveError = signal<string | null>(null);
  analyzingIndex = signal<number | null>(null);
  analysisError = signal<string | null>(null);

  readonly statuses: { value: PokemonStatus; label: string }[] = [
    { value: null, label: 'Benched' },
    { value: 'survived', label: 'Survived' },
    { value: 'fainted', label: 'Fainted' },
  ];

  ngOnInit(): void {
    const seed = this.matchup.report?.matches.length
      ? this.matchup.report.matches
      : this.matchup.matches;
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
                team1: game.team1.team,
                team2: game.team2.team,
              }),
            )
          : [this.buildGame()],
      ),
    });
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
    return side === 'side1' ? game.controls.team1.controls : game.controls.team2.controls;
  }

  nameOf(id: PokemonId): string {
    return getNameByPid(id) || id;
  }

  spriteFor(control: PokemonStatsForm) {
    const id = control.controls.id.value;
    return { id, name: this.nameOf(id) };
  }

  teamName(side: MatchupSideKey): string {
    return side === 'side1' ? this.matchup.team1.name : this.matchup.team2.name;
  }

  addGame(): void {
    this.games.push(this.buildGame());
  }

  removeGame(index: number): void {
    this.games.removeAt(index);
    if (!this.games.length) this.games.push(this.buildGame());
  }

  setStatus(control: PokemonStatsForm, status: PokemonStatus): void {
    control.controls.status.setValue(status);
    if (status === null) {
      control.controls.direct.setValue(0);
      control.controls.indirect.setValue(0);
      control.controls.teammate.setValue(0);
    }
  }

  adjustKills(control: PokemonStatsForm, delta: number): void {
    const next = Math.max(0, control.controls.direct.value + delta);
    control.controls.direct.setValue(next);
    if (next > 0 && control.controls.status.value === null) {
      control.controls.status.setValue('survived');
    }
  }

  killsOf(control: PokemonStatsForm): number {
    return control.controls.direct.value + control.controls.indirect.value;
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

  get incompleteGames(): number[] {
    return this.gameControls
      .map((game, index) => (game.controls.winner.value ? -1 : index + 1))
      .filter((value) => value > 0);
  }

  get canSubmit(): boolean {
    return !this.saving() && this.incompleteGames.length === 0;
  }

  analyze(index: number): void {
    const game = this.gameControls[index];
    const url = game.controls.link.value.trim();
    if (!url || this.analyzingIndex() !== null) return;

    this.analyzingIndex.set(index);
    this.analysisError.set(null);

    this.replayService
      .analyzeReplay(url)
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
      .submitMatchupReport(this.stageId, this.matchupId, this.buildPayload())
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
    const matches = this.gameControls.map((game) => ({
      link: game.controls.link.value.trim() || undefined,
      winner: game.controls.winner.value as MatchupSideKey,
      team1: {
        score: this.survivors(game, 'side1'),
        pokemon: this.rosterPayload(game, 'side1'),
      },
      team2: {
        score: this.survivors(game, 'side2'),
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
    };
  }

  private rosterPayload(game: GameForm, side: MatchupSideKey) {
    return this.rosterControls(game, side).reduce<
      Record<string, { kills: { direct: number; indirect: number; teammate: number }; status: 'brought' | 'survived' | 'fainted' }>
    >((acc, control) => {
      const { id, status, direct, indirect, teammate } = control.getRawValue();
      if (status) acc[id] = { kills: { direct, indirect, teammate }, status };
      return acc;
    }, {});
  }

  private buildGame(seed?: {
    link?: string;
    winner: MatchupSideKey | null;
    team1: Record<string, { kills?: { direct?: number; indirect?: number; teammate?: number }; status: 'brought' | 'survived' | 'fainted' }>;
    team2: Record<string, { kills?: { direct?: number; indirect?: number; teammate?: number }; status: 'brought' | 'survived' | 'fainted' }>;
  }): GameForm {
    return this.fb.group({
      link: this.fb.control(seed?.link ?? '', { nonNullable: true }),
      winner: this.fb.control<MatchupSideKey | null>(seed?.winner ?? null),
      team1: this.fb.array(
        this.matchup.team1.draft.map((pokemon) =>
          this.buildPokemon(pokemon.id, seed?.team1?.[pokemon.id]),
        ),
      ),
      team2: this.fb.array(
        this.matchup.team2.draft.map((pokemon) =>
          this.buildPokemon(pokemon.id, seed?.team2?.[pokemon.id]),
        ),
      ),
    });
  }

  private buildPokemon(
    id: PokemonId,
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

    const team1Ids = new Set(this.matchup.team1.draft.map((mon) => mon.id));
    const team2Ids = new Set(this.matchup.team2.draft.map((mon) => mon.id));
    const overlap = (player: ReplayPlayer, ids: Set<string>) =>
      player.team.reduce((count, mon) => (ids.has(mon.id) ? count + 1 : count), 0);

    const [first, second] = players;
    const straight =
      overlap(first, team1Ids) + overlap(second, team2Ids) >=
      overlap(first, team2Ids) + overlap(second, team1Ids);
    const side1Player = straight ? first : second;
    const side2Player = straight ? second : first;

    this.applyPlayer(game.controls.team1, side1Player);
    this.applyPlayer(game.controls.team2, side2Player);

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
