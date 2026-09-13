import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { isReplayUrl } from '@pdz/shared/widgets/score-entry/score-entry.model';
import {
  ScoreEntryReplayRosters,
  toRosterEntries,
} from '@pdz/shared/widgets/score-entry/score-entry.replay';
import { Subject, takeUntil } from 'rxjs';
import { DraftService } from '../../draft-overview/draft.service';
import {
  Match,
  MatchSide,
  MatchStatTuple,
  MatchTeam,
  Matchup,
  ScorePatch,
} from '../../matchup-overview/matchup.model';
import { KoGraphComponent, KoGraphRosters } from './ko-graph.component';
import {
  KO_SIDES,
  KoGraph,
  KoSide,
  emptyKoGraph,
  koGraphFromStatuses,
  koGraphWinner,
  koIdOf,
  koKey,
  koKills,
  koStatus,
  koSurvivors,
} from './ko-graph.model';
import { koGraphFromReplay } from './ko-graph.replay';

type KoGame = {
  link: string;
  graph: KoGraph;
  winner: KoSide | null;
};

const SIDE_OF: Record<KoSide, MatchSide> = { side1: 'a', side2: 'b' };

@Component({
  selector: 'pdz-opponent-score-v2',
  templateUrl: './opponent-score-v2.component.html',
  styleUrl: './opponent-score-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    IconComponent,
    InputDirective,
    KoGraphComponent,
    LoadingComponent,
    RouterModule,
    WidgetComponent,
  ],
})
export class OpponentScoreV2Component implements OnInit, OnDestroy {
  private readonly draftService = inject(DraftService);
  private readonly replayService = inject(ReplayService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  protected readonly draftPath = DRAFT_OVERVIEW_PATH;
  protected readonly sides = KO_SIDES;

  protected teamId = '';
  protected matchupId = '';

  protected readonly matchup = signal<Matchup | null>(null);
  protected readonly games = signal<KoGame[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly analyzingIndex = signal<number | null>(null);
  protected readonly analysisError = signal<string | null>(null);
  protected readonly analysisNote = signal<string | null>(null);

  private replayRosters: ScoreEntryReplayRosters = { side1: [], side2: [] };

  protected readonly rosters = computed<KoGraphRosters>(() => {
    const matchup = this.matchup();
    return {
      side1: matchup?.aTeam.team ?? [],
      side2: matchup?.bTeam.team ?? [],
    };
  });

  protected readonly keys = computed<Record<KoSide, string[]>>(() => {
    const rosters = this.rosters();
    return {
      side1: rosters.side1.map((pokemon) => koKey('side1', pokemon.id)),
      side2: rosters.side2.map((pokemon) => koKey('side2', pokemon.id)),
    };
  });

  protected readonly sideNames = computed<Record<KoSide, string>>(() => {
    const matchup = this.matchup();
    return {
      side1: matchup?.aTeam.teamName ?? 'Team A',
      side2: matchup?.bTeam.teamName ?? 'Team B',
    };
  });

  protected readonly seriesScore = computed<Record<KoSide, number>>(() => {
    const games = this.games();
    if (games.length === 1) {
      return {
        side1: this.gameScore(games[0], 'side1'),
        side2: this.gameScore(games[0], 'side2'),
      };
    }
    return games.reduce<Record<KoSide, number>>(
      (totals, game) => {
        const winner = this.gameWinner(game);
        if (winner) totals[winner] += 1;
        return totals;
      },
      { side1: 0, side2: 0 },
    );
  });

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamId') ?? '';
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (!('matchup' in params)) return;
        this.matchupId = params['matchup'];
        this.draftService
          .getMatchup(this.matchupId, this.teamId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => this.load(data));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected gameWinner(game: KoGame): KoSide | null {
    return game.winner ?? koGraphWinner(game.graph, this.keys());
  }

  protected gameScore(game: KoGame, side: KoSide): number {
    return koSurvivors(game.graph, this.keys()[side]);
  }

  protected setGraph(index: number, graph: KoGraph): void {
    this.games.update((games) =>
      games.map((game, i) => (i === index ? { ...game, graph } : game)),
    );
  }

  protected setLink(index: number, link: string): void {
    this.games.update((games) =>
      games.map((game, i) => (i === index ? { ...game, link } : game)),
    );
  }

  protected canAnalyze(game: KoGame): boolean {
    return isReplayUrl(game.link);
  }

  protected addGame(): void {
    this.games.update((games) => [
      ...games,
      { link: '', graph: emptyKoGraph(), winner: null },
    ]);
  }

  protected removeGame(index: number): void {
    this.games.update((games) => {
      const next = games.filter((_, i) => i !== index);
      return next.length
        ? next
        : [{ link: '', graph: emptyKoGraph(), winner: null }];
    });
  }

  protected analyze(index: number): void {
    if (this.analyzingIndex() !== null) return;
    const game = this.games()[index];

    this.analyzingIndex.set(index);
    this.analysisError.set(null);
    this.analysisNote.set(null);

    this.replayService
      .analyzeReplayV2(game.link.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analyzingIndex.set(null);
          const result = koGraphFromReplay(data.analysis, this.replayRosters);
          if (!result) {
            this.analysisError.set('That replay does not have two players.');
            return;
          }
          this.games.update((games) =>
            games.map((entry, i) =>
              i === index
                ? { ...entry, graph: result.graph, winner: result.winner }
                : entry,
            ),
          );
          this.analysisNote.set(
            `Game ${index + 1}: ${result.attributed} of ${result.total} KOs attributed.`,
          );
        },
        error: (error) => {
          this.analyzingIndex.set(null);
          this.analysisError.set(
            error?.message || 'Could not read that replay.',
          );
        },
      });
  }

  protected submit(): void {
    const matchup = this.matchup();
    if (!matchup || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);

    this.draftService
      .scoreMatchup(this.matchupId, this.teamId, this.buildPayload(matchup))
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

  private load(matchup: Matchup): void {
    this.matchup.set(matchup);
    this.replayRosters = {
      side1: toRosterEntries(matchup.aTeam.team),
      side2: toRosterEntries(matchup.bTeam.team),
    };
    this.games.set(
      matchup.matches.length
        ? matchup.matches.map((match) => this.seed(match))
        : [{ link: '', graph: emptyKoGraph(), winner: null }],
    );
  }

  private seed(match: Match): KoGame {
    const entries = [
      ...this.statusEntries('side1', match.aTeam),
      ...this.statusEntries('side2', match.bTeam),
    ];
    return {
      link: match.replay ?? '',
      graph: koGraphFromStatuses(entries),
      winner:
        match.winner === 'a' ? 'side1' : match.winner === 'b' ? 'side2' : null,
    };
  }

  private statusEntries(side: KoSide, team?: MatchTeam) {
    return (team?.stats ?? []).map(([id, stat]) => ({
      key: koKey(side, id),
      status:
        stat.status ??
        (stat.deaths ? 'fainted' : stat.brought ? 'survived' : 'brought'),
    }));
  }

  private buildPayload(matchup: Matchup): ScorePatch {
    return {
      aTeamPaste: matchup.aTeam.paste ?? '',
      bTeamPaste: matchup.bTeam.paste ?? '',
      matches: this.games().map((game) => {
        const link = game.link.trim();
        const winner = this.gameWinner(game);
        return {
          aTeam: this.teamPayload(game, 'side1'),
          bTeam: this.teamPayload(game, 'side2'),
          ...(link ? { replay: link } : {}),
          ...(winner ? { winner: SIDE_OF[winner] } : {}),
        };
      }),
      scoreOverride: matchup.scoreOverride ?? null,
      winnerOverride: matchup.winnerOverride ?? null,
      forfeitedBy: matchup.forfeitedBy ?? null,
    };
  }

  private teamPayload(game: KoGame, side: KoSide): MatchTeam {
    const stats = this.keys()[side].reduce<MatchStatTuple[]>((acc, key) => {
      const status = koStatus(game.graph, key);
      if (!status) return acc;
      const kills = koKills(game.graph, key);
      acc.push([
        koIdOf(key),
        {
          kills: kills.direct,
          indirect: kills.indirect,
          teammate: kills.teammate,
          status,
        },
      ]);
      return acc;
    }, []);

    return { stats, score: this.gameScore(game, side) };
  }
}
