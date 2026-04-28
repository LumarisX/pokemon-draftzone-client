import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  distinctUntilChanged,
  map,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { getNameByPid, PokemonId } from '../../../data/namedex';
import { IconComponent } from '../../../images/icon/icon.component';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { LeagueManageService } from '../../../services/leagues/league-manage.service';
import { ReplayService } from '../../../services/replay.service';
import {
  ReplayAnalysis,
  ReplayPlayer,
} from '../../../tools/replay_analyzer/replay.interface';
import { League } from '../../league.interface';

type PokemonStatsForm = FormGroup<{
  id: FormControl<PokemonId | ''>;
  kills: FormGroup<{
    direct: FormControl<number>;
    indirect: FormControl<number>;
    teammate: FormControl<number>;
  }>;
  status: FormControl<'brought' | 'survived' | 'fainted' | null>;
}>;

type MatchForm = FormGroup<{
  link: FormControl<string>;
  team1Score: FormControl<number>;
  team2Score: FormControl<number>;
  winner: FormControl<'side1' | 'side2' | 'draw' | null>;
  team1Pokemon: FormArray<PokemonStatsForm>;
  team2Pokemon: FormArray<PokemonStatsForm>;
}>;

type MatchupForm = FormGroup<{
  matchupScoreTeam1: FormControl<number>;
  matchupScoreTeam2: FormControl<number>;
  matchupWinner: FormControl<
    'side1' | 'side2' | 'draw' | 'side1ffw' | 'side2ffw' | 'dffl' | null
  >;
  matches: FormArray<MatchForm>;
}>;

type PokemonStatsSeed = League.MatchPokemonStats | { status: null };

type ScheduleMatchPayload = {
  link?: string;
  winner: 'side1' | 'side2' | 'draw';
  team1: { score: number; pokemon: Record<string, PokemonStatsSeed> };
  team2: { score: number; pokemon: Record<string, PokemonStatsSeed> };
};

type ScheduleMatchupPayload = {
  score?: { team1: number; team2: number };
  winner?: 'side1' | 'side2' | 'draw' | 'side1ffw' | 'side2ffw' | 'dffl' | null;
  matches: ScheduleMatchPayload[];
};

type MatchupPokemonSummary = {
  key: string;
  name: string;
  kills: number;
  deaths: number;
};

@Component({
  selector: 'pdz-league-manage-schedule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    RouterModule,
    LoadingComponent,
  ],
  templateUrl: './league-manage-schedule.component.html',
  styleUrl: './league-manage-schedule.component.scss',
})
export class LeagueManageScheduleComponent {
  private leagueManageService = inject(LeagueManageService);
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private matchupForms = new Map<string, MatchupForm>();
  private analysisState = new Map<
    string,
    { loading: boolean; error?: string }
  >();
  private saveState = new Map<
    string,
    { loading: boolean; success: boolean; error?: string }
  >();
  private stageCollapsedState = new Map<string, boolean>();
  private openMatchIndexState = new Map<string, number | null>();
  private matchupSummaryCollapsedState = new Map<string, boolean>();

  isPlayoffMode = false;
  scheduleStages?: League.Stage[];

  ngOnInit(): void {
    this.isPlayoffMode = this.route.snapshot.data['mode'] === 'playoffs';

    if (this.isPlayoffMode) {
      this.leagueManageService
        .getPlayoffSchedule()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.scheduleStages = data.stages;
            this.buildMatchupForms(data.stages);
            this.stageCollapsedState.set(
              data.stages[data.currentStage]?._id,
              true,
            );
          },
        });
    } else {
      this.route.paramMap
        .pipe(
          map((params) => params.get('divisionKey')),
          distinctUntilChanged(),
          tap(() => {
            this.scheduleStages = undefined;
            this.matchupForms.clear();
            this.stageCollapsedState.clear();
            this.openMatchIndexState.clear();
            this.matchupSummaryCollapsedState.clear();
          }),
          switchMap(() => this.leagueManageService.getSchedule()),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (data) => {
            this.scheduleStages = data.stages;
            this.buildMatchupForms(data.stages);
            this.stageCollapsedState.set(
              data.stages[data.currentStage]?._id,
              true,
            );
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMatchupForm(matchupId: string): MatchupForm | undefined {
    return this.matchupForms.get(matchupId);
  }

  getMatchControls(matchupId: string): MatchForm[] {
    const form = this.getMatchupForm(matchupId);
    return form ? (form.controls.matches.controls as MatchForm[]) : [];
  }

  getPokemonControls(
    matchupId: string,
    matchIndex: number,
    team: 'team1' | 'team2',
  ): PokemonStatsForm[] {
    const matchForm = this.getMatchForm(matchupId, matchIndex);
    if (!matchForm) return [];
    return team === 'team1'
      ? (matchForm.controls.team1Pokemon.controls as PokemonStatsForm[])
      : (matchForm.controls.team2Pokemon.controls as PokemonStatsForm[]);
  }

  getPokemonLabel(pokemonId: PokemonId | ''): string {
    if (!pokemonId) return '';
    return getNameByPid(pokemonId as PokemonId) || pokemonId;
  }

  addMatch(matchup: League.Matchup): void {
    const form = this.getMatchupForm(matchup.id);
    if (!form) return;
    form.controls.matches.push(this.buildMatchForm(matchup));
    this.openMatchIndexState.set(matchup.id, form.controls.matches.length - 1);
  }

  removeMatch(matchupId: string, matchIndex: number): void {
    const form = this.getMatchupForm(matchupId);
    if (!form) return;
    form.controls.matches.removeAt(matchIndex);

    const openMatchIndex = this.openMatchIndexState.get(matchupId);
    if (openMatchIndex === null || openMatchIndex === undefined) return;
    if (openMatchIndex === matchIndex) {
      this.openMatchIndexState.set(matchupId, null);
      return;
    }
    if (openMatchIndex > matchIndex) {
      this.openMatchIndexState.set(matchupId, openMatchIndex - 1);
    }
  }

  toggleMatch(matchupId: string, matchIndex: number): void {
    const currentOpen = this.openMatchIndexState.get(matchupId);
    this.openMatchIndexState.set(
      matchupId,
      currentOpen === matchIndex ? null : matchIndex,
    );
  }

  isMatchOpen(matchupId: string, matchIndex: number): boolean {
    return this.openMatchIndexState.get(matchupId) === matchIndex;
  }

  toggleMatchupSummary(matchupId: string): void {
    this.matchupSummaryCollapsedState.set(
      matchupId,
      this.isMatchupSummaryOpen(matchupId),
    );
  }

  isMatchupSummaryOpen(matchupId: string): boolean {
    return !(this.matchupSummaryCollapsedState.get(matchupId) ?? true);
  }

  getMatchWinnerLabel(
    matchup: League.Matchup,
    matchupId: string,
    matchIndex: number,
  ): string {
    const matchForm = this.getMatchForm(matchupId, matchIndex);
    if (!matchForm) return 'Unassigned';
    const winner = matchForm.controls.winner.value;
    if (winner === 'side1') return matchup.team1.name;
    if (winner === 'side2') return matchup.team2.name;
    return 'Unassigned';
  }

  getMatchupPokemonSummary(
    matchup: League.Matchup,
    matchupId: string,
    team: 'team1' | 'team2',
  ): MatchupPokemonSummary[] {
    const matches = this.getMatchControls(matchupId);
    const totals = new Map<
      string,
      MatchupPokemonSummary & { hadStatus: boolean }
    >();

    matches.forEach((match, matchIndex) => {
      const pokemonControls = this.getPokemonControls(
        matchupId,
        matchIndex,
        team,
      );
      pokemonControls.forEach((control) => {
        const pokemonId = control.controls.id.value;
        if (!pokemonId) return;

        const key = `${team}-${pokemonId}`;
        const status = control.controls.status.value;
        const existing = totals.get(key) ?? {
          key,
          name: this.getPokemonLabel(pokemonId),
          kills: 0,
          deaths: 0,
          hadStatus: false,
        };

        existing.kills +=
          control.controls.kills.controls.direct.value +
          control.controls.kills.controls.indirect.value;
        existing.deaths += status === 'fainted' ? 1 : 0;
        existing.hadStatus ||= status !== null;

        totals.set(key, existing);
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

  getSortedMatchups(matchups: League.Matchup[]): League.Matchup[] {
    return [...matchups].sort((a, b) => {
      const aScored = this.isMatchupScored(a);
      const bScored = this.isMatchupScored(b);
      if (aScored === bScored) return 0;
      return aScored ? 1 : -1;
    });
  }

  private isMatchupScored(matchup: League.Matchup): boolean {
    return (
      (matchup.team1.score ?? 0) > 0 ||
      (matchup.team2.score ?? 0) > 0 ||
      !!matchup.winner ||
      matchup.matches.some((match) => match.link && match.link.trim() !== '')
    );
  }

  analyzeMatchReplay(matchup: League.Matchup, matchIndex: number): void {
    const matchForm = this.getMatchForm(matchup.id, matchIndex);
    if (!matchForm) return;

    const replayUrl = matchForm.controls.link.value.trim();
    if (!replayUrl) return;

    const stateKey = this.getAnalysisKey(matchup.id, matchIndex);
    this.analysisState.set(stateKey, { loading: true });

    this.replayService
      .analyzeReplay(replayUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.applyReplayToMatch(matchup, matchIndex, data.analysis);
          this.updateMatchupScoresFromMatches(matchup.id);
          this.analysisState.set(stateKey, { loading: false });
        },
        error: (error) => {
          this.analysisState.set(stateKey, {
            loading: false,
            error: error?.message || 'Replay analysis failed.',
          });
        },
      });
  }

  saveMatchup(matchup: League.Matchup): void {
    const form = this.getMatchupForm(matchup.id);
    if (!form) return;

    this.saveState.set(matchup.id, { loading: true, success: false });

    const payload = this.buildMatchupPayload(form);
    const save$ = this.isPlayoffMode
      ? this.leagueManageService.updatePlayoffMatchup(matchup.id, payload)
      : this.leagueManageService.updateMatchupSchedule(matchup.id, payload);
    save$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saveState.set(matchup.id, { loading: false, success: true });
        // Reset success message after 2 seconds
        setTimeout(() => {
          if (this.saveState.get(matchup.id)?.success) {
            this.saveState.set(matchup.id, {
              loading: false,
              success: false,
            });
          }
        }, 2000);
      },
      error: (error) => {
        this.saveState.set(matchup.id, {
          loading: false,
          success: false,
          error: error?.message || 'Failed to save matchup.',
        });
      },
    });
  }

  isAnalyzing(matchupId: string, matchIndex: number): boolean {
    return (
      this.analysisState.get(this.getAnalysisKey(matchupId, matchIndex))
        ?.loading ?? false
    );
  }

  getAnalysisError(matchupId: string, matchIndex: number): string | undefined {
    return this.analysisState.get(this.getAnalysisKey(matchupId, matchIndex))
      ?.error;
  }

  isSaving(matchupId: string): boolean {
    return this.saveState.get(matchupId)?.loading ?? false;
  }

  getSaveSuccess(matchupId: string): boolean {
    return this.saveState.get(matchupId)?.success ?? false;
  }

  getSaveError(matchupId: string): string | undefined {
    return this.saveState.get(matchupId)?.error;
  }

  toggleStage(stageId: string): void {
    this.stageCollapsedState.set(
      stageId,
      !this.stageCollapsedState.get(stageId),
    );
  }

  isStageOpen(stageId: string): boolean {
    return this.stageCollapsedState.get(stageId) ?? false;
  }

  getMatchValidationWarnings(matchupId: string, matchIndex: number): string[] {
    const matchForm = this.getMatchForm(matchupId, matchIndex);
    if (!matchForm) return [];

    const warnings: string[] = [];

    // Check brought limit (max 6 per team)
    const team1Brought = (
      matchForm.controls.team1Pokemon.controls as PokemonStatsForm[]
    ).filter((control) => control.controls.status.value !== null).length;
    const team2Brought = (
      matchForm.controls.team2Pokemon.controls as PokemonStatsForm[]
    ).filter((control) => control.controls.status.value !== null).length;

    if (team1Brought != 6) {
      warnings.push(`Team 1 has ${team1Brought} Pokémon`);
    }
    if (team2Brought != 6) {
      warnings.push(`Team 2 has ${team2Brought} Pokémon`);
    }

    // Check kills/indirect vs deaths balance
    const team1Kills = (
      matchForm.controls.team1Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) =>
        sum +
        control.controls.kills.controls.direct.value +
        control.controls.kills.controls.indirect.value,
      0,
    );
    const team1TeamKills = (
      matchForm.controls.team1Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) => sum + control.controls.kills.controls.teammate.value,
      0,
    );
    const team2Deaths = (
      matchForm.controls.team2Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) =>
        sum + (control.controls.status.value === 'fainted' ? 1 : 0),
      0,
    );
    const team2Kills = (
      matchForm.controls.team2Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) =>
        sum +
        control.controls.kills.controls.direct.value +
        control.controls.kills.controls.indirect.value,
      0,
    );
    const team2TeamKills = (
      matchForm.controls.team2Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) => sum + control.controls.kills.controls.teammate.value,
      0,
    );
    const team1Deaths = (
      matchForm.controls.team1Pokemon.controls as PokemonStatsForm[]
    ).reduce(
      (sum, control) =>
        sum + (control.controls.status.value === 'fainted' ? 1 : 0),
      0,
    );

    if (team1Kills !== team2Deaths - team2TeamKills) {
      warnings.push(
        `Team 1 kills (${team1Kills}) ≠ Team 2 deaths (${team2Deaths - team2TeamKills})`,
      );
    }
    if (team2Kills !== team1Deaths - team1TeamKills) {
      warnings.push(
        `Team 2 kills (${team2Kills}) ≠ Team 1 deaths (${team1Deaths - team1TeamKills})`,
      );
    }

    return warnings;
  }

  private buildMatchupForms(stages: League.Stage[]): void {
    this.matchupForms.clear();
    this.openMatchIndexState.clear();
    this.matchupSummaryCollapsedState.clear();
    stages.forEach((stage) => {
      stage.matchups.forEach((matchup) => {
        this.matchupForms.set(matchup.id, this.buildMatchupForm(matchup));
        this.openMatchIndexState.set(matchup.id, null);
        this.matchupSummaryCollapsedState.set(matchup.id, true);
      });
    });
  }

  private buildMatchupForm(matchup: League.Matchup): MatchupForm {
    const scoreTeam1 = matchup.team1.score ?? 0;
    const scoreTeam2 = matchup.team2.score ?? 0;
    const matchForms = matchup.matches.length
      ? matchup.matches.map((match) => this.buildMatchForm(matchup, match))
      : [];

    return this.fb.group({
      matchupScoreTeam1: this.fb.control(scoreTeam1, { nonNullable: true }),
      matchupScoreTeam2: this.fb.control(scoreTeam2, { nonNullable: true }),
      matchupWinner: this.fb.control<
        'side1' | 'side2' | 'draw' | 'side1ffw' | 'side2ffw' | 'dffl' | null
      >(matchup.winner ?? null),
      matches: this.fb.array(matchForms),
    });
  }

  private buildMatchForm(
    matchup: League.Matchup,
    match?: League.Matchup['matches'][number],
  ): MatchForm {
    const team1Seed = match?.team1?.team ?? {};
    const team2Seed = match?.team2?.team ?? {};

    return this.fb.group({
      link: this.fb.control(match?.link ?? '', { nonNullable: true }),
      team1Score: this.fb.control(match?.team1?.score ?? 0, {
        nonNullable: true,
      }),
      team2Score: this.fb.control(match?.team2?.score ?? 0, {
        nonNullable: true,
      }),
      winner: this.fb.control<'side1' | 'side2' | 'draw' | null>(
        match?.team1?.winner ? 'side1' : match?.team2?.winner ? 'side2' : null,
      ),
      team1Pokemon: this.fb.array(
        matchup.team1.draft.map((pokemon) =>
          this.buildPokemonStatsForm(pokemon.id, team1Seed[pokemon.id]),
        ),
      ),
      team2Pokemon: this.fb.array(
        matchup.team2.draft.map((pokemon) =>
          this.buildPokemonStatsForm(pokemon.id, team2Seed[pokemon.id]),
        ),
      ),
    });
  }

  private buildPokemonStatsForm(
    pokemonId: PokemonId | '',
    stats?: League.MatchPokemonStats,
  ): PokemonStatsForm {
    return this.fb.group({
      id: this.fb.control(pokemonId, { nonNullable: true }),
      kills: this.fb.group({
        direct: this.fb.control(stats?.kills?.direct ?? 0, {
          nonNullable: true,
        }),
        indirect: this.fb.control(stats?.kills?.indirect ?? 0, {
          nonNullable: true,
        }),
        teammate: this.fb.control(stats?.kills?.teammate ?? 0, {
          nonNullable: true,
        }),
      }),
      status: this.fb.control(stats?.status ?? null),
    });
  }

  private getMatchForm(
    matchupId: string,
    matchIndex: number,
  ): MatchForm | null {
    const form = this.getMatchupForm(matchupId);
    if (!form) return null;
    return form.controls.matches.at(matchIndex) as MatchForm;
  }

  private getAnalysisKey(matchupId: string, matchIndex: number): string {
    return `${matchupId}-${matchIndex}`;
  }

  private applyReplayToMatch(
    matchup: League.Matchup,
    matchIndex: number,
    replay: ReplayAnalysis,
  ): void {
    const matchForm = this.getMatchForm(matchup.id, matchIndex);
    if (!matchForm) return;

    const assignment = this.mapReplayPlayersToTeams(replay, matchup);
    if (!assignment.team1 || !assignment.team2) return;

    this.resetPokemonStats(matchForm.controls.team1Pokemon);
    this.resetPokemonStats(matchForm.controls.team2Pokemon);

    this.applyReplayStatsToTeam(
      matchForm.controls.team1Pokemon,
      assignment.team1,
    );
    this.applyReplayStatsToTeam(
      matchForm.controls.team2Pokemon,
      assignment.team2,
    );
    matchForm.controls.winner.setValue(
      assignment.team1.win ? 'side1' : assignment.team2.win ? 'side2' : null,
    );

    matchForm.controls.team1Score.setValue(
      assignment.team1.team.reduce(
        (sum, mon) => sum + (mon.status === 'survived' ? 1 : 0),
        0,
      ),
    );
    matchForm.controls.team2Score.setValue(
      assignment.team2.team.reduce(
        (sum, mon) => sum + (mon.status === 'survived' ? 1 : 0),
        0,
      ),
    );
  }

  private mapReplayPlayersToTeams(
    replay: ReplayAnalysis,
    matchup: League.Matchup,
  ): { team1?: ReplayPlayer; team2?: ReplayPlayer } {
    const players = replay.players.slice(0, 2);
    if (players.length < 2) {
      return { team1: players[0], team2: players[1] };
    }

    const team1Ids = new Set(matchup.team1.draft.map((p) => p.id));
    const team2Ids = new Set(matchup.team2.draft.map((p) => p.id));

    const overlaps = players.map((player) => ({
      player,
      team1: this.countOverlap(player, team1Ids),
      team2: this.countOverlap(player, team2Ids),
    }));

    const [first, second] = overlaps;
    const assignFirstToTeam1 =
      first.team1 + second.team2 >= first.team2 + second.team1;

    return assignFirstToTeam1
      ? { team1: first.player, team2: second.player }
      : { team1: second.player, team2: first.player };
  }

  private countOverlap(player: ReplayPlayer, ids: Set<PokemonId | ''>): number {
    return player.team.reduce((count, mon) => {
      const pid = mon.id;
      return ids.has(pid) ? count + 1 : count;
    }, 0);
  }

  private resetPokemonStats(array: FormArray<PokemonStatsForm>): void {
    array.controls.forEach((control) => {
      control.patchValue({
        status: null,
        kills: {
          direct: 0,
          indirect: 0,
          teammate: 0,
        },
      });
    });
  }

  private applyReplayStatsToTeam(
    array: FormArray<PokemonStatsForm>,
    player: ReplayPlayer,
  ): void {
    const controlMap = new Map(
      array.controls.map((control) => [control.controls.id.value, control]),
    );

    player.team.forEach((mon) => {
      const control = controlMap.get(mon.id);
      if (!control) return;

      control.patchValue({
        kills: {
          direct: mon.kills?.direct ?? 0,
          indirect: mon.kills?.indirect ?? 0,
          teammate: mon.kills?.teammate ?? 0,
        },
        status: mon.status ?? null,
      });
    });
  }

  private updateMatchupScoresFromMatches(matchupId: string): void {
    const form = this.getMatchupForm(matchupId);
    if (!form) return;

    let team1Wins = 0;
    let team2Wins = 0;

    form.controls.matches.controls.forEach((match) => {
      const winner = match.controls.winner.value;
      if (winner === 'side1') {
        team1Wins++;
      } else if (winner === 'side2') {
        team2Wins++;
      }
    });

    form.controls.matchupScoreTeam1.setValue(team1Wins);
    form.controls.matchupScoreTeam2.setValue(team2Wins);

    let matchupWinner: 'side1' | 'side2' | 'draw' | null = null;
    if (team1Wins > team2Wins) {
      matchupWinner = 'side1';
    } else if (team2Wins > team1Wins) {
      matchupWinner = 'side2';
    }
    form.controls.matchupWinner.setValue(matchupWinner);
  }

  private buildMatchupPayload(form: MatchupForm): ScheduleMatchupPayload {
    const matches = form.controls.matches.controls.map((match) => {
      const team1Pokemon = this.buildPokemonPayload(
        match.controls.team1Pokemon,
      );
      const team2Pokemon = this.buildPokemonPayload(
        match.controls.team2Pokemon,
      );
      const winner =
        match.controls.winner.value ??
        (match.controls.team1Score.value >= match.controls.team2Score.value
          ? 'side1'
          : 'side2');

      return {
        link: match.controls.link.value.trim() || undefined,
        winner,
        team1: {
          score: match.controls.team1Score.value,
          pokemon: team1Pokemon,
        },
        team2: {
          score: match.controls.team2Score.value,
          pokemon: team2Pokemon,
        },
      };
    });

    const winner = form.controls.matchupWinner.value ?? undefined;
    return {
      score: {
        team1: form.controls.matchupScoreTeam1.value,
        team2: form.controls.matchupScoreTeam2.value,
      },
      winner,
      matches,
    };
  }

  private buildPokemonPayload(
    array: FormArray<PokemonStatsForm>,
  ): Record<string, PokemonStatsSeed> {
    return array.controls.reduce<Record<string, PokemonStatsSeed>>(
      (acc, control) => {
        const { id, status, kills } = control.getRawValue();
        const hasStats = status || kills;
        if (id && hasStats) {
          acc[id] = { kills, status };
        }
        return acc;
      },
      {},
    );
  }
}
