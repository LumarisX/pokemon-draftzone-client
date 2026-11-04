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
import { DRAFT_AREA, draftLinks } from '@pdz/features/drafts/draft-area';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { isReplayUrl } from '@pdz/shared/widgets/score-entry/score-entry.model';
import {
  ScoreEntryReplayRosters,
  toRosterEntries,
} from '@pdz/shared/widgets/score-entry/score-entry.replay';
import { Subject, takeUntil } from 'rxjs';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import {
  Match,
  MatchSide,
  MatchStatTuple,
  MatchTeam,
  Matchup,
  ScorePatch,
} from '@pdz/features/drafts/matchup-overview/matchup.model';
import { KoGraphComponent, KoGraphRosters } from './ko-graph.component';
import {
  KO_SIDES,
  KoGraph,
  KoKills,
  KoSheets,
  KoSide,
  emptyKoGraph,
  emptyKoSheets,
  keepSheet,
  koGraphFromStatuses,
  koGraphWinner,
  koIdOf,
  koKey,
  koKills,
  koStatus,
  koSurvivors,
  kosFromKoGraph,
  mergeSheet,
  orderedSheet,
} from './ko-graph.model';
import { koGraphFromReplay } from './ko-graph.replay';
import { TeamSheetsComponent } from './team-sheets.component';

type KoGame = {
  link: string;
  graph: KoGraph;
  winner: KoSide | null;
  classicKills: Record<string, KoKills> | null;
};

const SIDE_OF: Record<KoSide, MatchSide> = { side1: 'a', side2: 'b' };

const NO_KILLS: KoKills = { direct: 0, indirect: 0, teammate: 0 };

function newGame(): KoGame {
  return { link: '', graph: emptyKoGraph(), winner: null, classicKills: null };
}

function usesClassicKills(
  game: KoGame,
): game is KoGame & { classicKills: Record<string, KoKills> } {
  return game.classicKills !== null && game.graph.edges.length === 0;
}

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
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    RouterModule,
    TeamSheetsComponent,
    WidgetComponent,
  ],
})
export class OpponentScoreV2Component implements OnInit, OnDestroy {
  private readonly draftService = inject(DraftService);
  private readonly replayService = inject(ReplayService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  private readonly area = inject(DRAFT_AREA);

  protected teamId = '';
  protected draftPage: string[] = [];
  protected matchupId = '';

  protected readonly matchup = signal<Matchup | null>(null);
  protected readonly sheets = signal<KoSheets>(emptyKoSheets());
  protected readonly editingSheets = signal(false);
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

  private readonly rosterKeys = computed<Record<KoSide, string[]>>(() => {
    const rosters = this.rosters();
    return {
      side1: rosters.side1.map((pokemon) => koKey('side1', pokemon.id)),
      side2: rosters.side2.map((pokemon) => koKey('side2', pokemon.id)),
    };
  });

  protected readonly sheetRosters = computed<KoGraphRosters>(() => {
    const rosters = this.rosters();
    const sheets = this.sheets();
    const only = (side: KoSide) =>
      rosters[side].filter((pokemon) =>
        sheets[side].includes(koKey(side, pokemon.id)),
      );
    return { side1: only('side1'), side2: only('side2') };
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
    this.draftPage = draftLinks(this.teamId, this.area).page;
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
    return game.winner ?? koGraphWinner(game.graph, this.sheets());
  }

  protected gameScore(game: KoGame, side: KoSide): number {
    return koSurvivors(game.graph, this.sheets()[side]);
  }

  protected setSheets(sheets: KoSheets): void {
    this.sheets.set(sheets);
    this.games.update((games) =>
      games.map((game) => ({ ...game, graph: keepSheet(game.graph, sheets) })),
    );
  }

  protected setGraph(index: number, graph: KoGraph): void {
    this.games.update((games) =>
      games.map((game, i) =>
        i === index ? { ...game, graph, winner: null } : game,
      ),
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

  protected classicKoCount(game: KoGame): number {
    if (!usesClassicKills(game)) return 0;
    return Object.values(game.classicKills).reduce(
      (total, kills) => total + kills.direct + kills.indirect + kills.teammate,
      0,
    );
  }

  protected addGame(): void {
    this.games.update((games) => [...games, newGame()]);
  }

  protected removeGame(index: number): void {
    this.games.update((games) => {
      const next = games.filter((_, i) => i !== index);
      return next.length ? next : [newGame()];
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
          const current = this.sheets();
          const keys = this.rosterKeys();
          this.setSheets({
            side1: mergeSheet(current.side1, keys.side1, result.sheets.side1),
            side2: mergeSheet(current.side2, keys.side2, result.sheets.side2),
          });
          const sheets = this.sheets();
          this.games.update((games) =>
            games.map((entry, i) =>
              i === index
                ? {
                    ...entry,
                    graph: keepSheet(result.graph, sheets),
                    winner: result.winner,
                    classicKills: null,
                  }
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
          this.router.navigate(this.draftPage);
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

    const keys = this.rosterKeys();
    const brought = (side: KoSide, team: (match: Match) => MatchTeam) =>
      orderedSheet(
        keys[side],
        matchup.matches.flatMap((match) =>
          (team(match)?.stats ?? []).map(([id]) => koKey(side, id)),
        ),
      );
    const sheets: KoSheets = {
      side1: brought('side1', (match) => match.aTeam),
      side2: brought('side2', (match) => match.bTeam),
    };
    this.sheets.set(sheets);
    this.editingSheets.set(!sheets.side1.length && !sheets.side2.length);

    this.games.set(
      matchup.matches.length
        ? matchup.matches.map((match) => this.seed(match, sheets))
        : [newGame()],
    );
  }

  private seed(match: Match, sheets: KoSheets): KoGame {
    const entries = [
      ...this.statusEntries('side1', match.aTeam),
      ...this.statusEntries('side2', match.bTeam),
    ];
    const graph = keepSheet(koGraphFromStatuses(entries, match.kos), sheets);
    const stored =
      match.winner === 'a' ? 'side1' : match.winner === 'b' ? 'side2' : null;
    return {
      link: match.replay ?? '',
      graph,
      winner: stored === koGraphWinner(graph, sheets) ? null : stored,
      classicKills: match.kos ? null : this.classicKills(match),
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

  private classicKills(match: Match): Record<string, KoKills> | null {
    const kills: Record<string, KoKills> = {};
    let any = false;
    for (const [side, team] of [
      ['side1', match.aTeam],
      ['side2', match.bTeam],
    ] as const) {
      for (const [id, stat] of team?.stats ?? []) {
        const entry = {
          direct: stat.kills ?? 0,
          indirect: stat.indirect ?? 0,
          teammate: stat.teammate ?? 0,
        };
        if (entry.direct || entry.indirect || entry.teammate) any = true;
        kills[koKey(side, id)] = entry;
      }
    }
    return any ? kills : null;
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
          ...(usesClassicKills(game)
            ? {}
            : { kos: kosFromKoGraph(game.graph) }),
        };
      }),
      scoreOverride: matchup.scoreOverride ?? null,
      winnerOverride: matchup.winnerOverride ?? null,
      forfeitedBy: matchup.forfeitedBy ?? null,
    };
  }

  private teamPayload(game: KoGame, side: KoSide): MatchTeam {
    const stats = this.sheets()[side].map<MatchStatTuple>((key) => {
      const kills = usesClassicKills(game)
        ? (game.classicKills[key] ?? NO_KILLS)
        : koKills(game.graph, key);
      return [
        koIdOf(key),
        {
          kills: kills.direct,
          indirect: kills.indirect,
          teammate: kills.teammate,
          status: koStatus(game.graph, key),
        },
      ];
    });

    return { stats, score: this.gameScore(game, side) };
  }
}
