import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  BehaviorSubject,
  Subject,
  catchError,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { DraftSwitcherComponent } from '../../league-widgets/draft-switcher/draft-switcher.component';
import { TradeLog, TradeStatus } from '../../league.interface';

const FREE_AGENCY = 'free-agency';

type TradeOption = DraftPokemon & { cost: number; tier: string };

type SideKey = 'side1' | 'side2';

interface SideState {
  teamId: string;
  picks: TradeOption[];
  tradePoints: number;
  options$: BehaviorSubject<DraftPokemon[]>;
}

interface TeamSpend {
  teamId: string;
  teamName: string;
  spent: number;
}

interface ManagedTeam {
  id: string;
  name: string;
  coachName: string;
  roster: TradeOption[];
}

@Component({
  selector: 'pdz-trade-manager',
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    IconComponent,
    SpriteComponent,
    PokemonSearchComponent,
    DraftSwitcherComponent,
  ],
  templateUrl: './trade-manager.component.html',
  styleUrl: './trade-manager.component.scss',
})
export class TradeManagerComponent implements OnInit, OnDestroy {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly tierListService = inject(TierListService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  submitting = false;
  submitError = '';
  resolvingTradeId: string | null = null;
  resolveErrorById: Record<string, string> = {};

  teams: ManagedTeam[] = [];
  rounds: { name: string; trades: TradeLog[] }[] = [];
  roundNames: string[] = [];
  currentRoundIndex = 0;
  roundIndex = 0;

  tradePointLimit: number | null = null;
  spentByTeam: TeamSpend[] = [];

  private freeAgents: TradeOption[] = [];

  readonly freeAgency = FREE_AGENCY;

  side1: SideState = this.blankSide();
  side2: SideState = this.blankSide();

  /** Resolved from the route when present, else the tournament's first draft. */
  draftSlug: string | null = null;
  noDrafts = false;

  /**
   * Teams that drafted in {@link draftSlug}. Everything on this page is scoped
   * to it: only these teams can trade with each other, only their spend counts
   * against the ledger, and only Pokémon none of them hold are free agents.
   */
  private teamIdsInDraft = new Set<string>();

  get signUpsPath(): string {
    return `/leagues/${this.leagueService.leagueSlug()}/tournaments/${this.leagueService.tournamentSlug()}/manage/sign-ups`;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('draftSlug')),
        distinctUntilChanged(),
        switchMap((routeDraftSlug) =>
          routeDraftSlug
            ? of(routeDraftSlug)
            : this.leagueService
                .getLeagueInfo()
                .pipe(map((info) => info.drafts[0]?.draftSlug ?? null)),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((draftSlug) => {
        this.draftSlug = draftSlug;
        this.noDrafts = !draftSlug;
        if (draftSlug) this.load();
        else this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDraftSelected(draftSlug: string): void {
    this.router.navigate([
      '/leagues',
      this.leagueService.leagueSlug(),
      'tournaments',
      this.leagueService.tournamentSlug(),
      'manage',
      'drafts',
      draftSlug,
      'trades',
    ]);
  }

  private blankSide(): SideState {
    return {
      teamId: '',
      picks: [],
      tradePoints: 0,
      options$: new BehaviorSubject<DraftPokemon[]>([]),
    };
  }

  private load(): void {
    this.loading = true;
    this.resetForm();

    forkJoin({
      tierList: this.tierListService.getTierList().pipe(
        take(1),
        catchError(() => of(null)),
      ),
      teams: this.leagueService.getTournamentTeams().pipe(
        take(1),
        catchError(() => of({ teams: [] })),
      ),
      trades: this.leagueService
        .getTrades()
        .pipe(take(1)),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tierList, teams, trades }) => {
          // The teams endpoint is tournament-wide; a trade only ever happens
          // inside one draft pool, so everything below works off this slice.
          const inDraft = teams.teams.filter(
            (team) => team.draft?.draftSlug === this.draftSlug,
          );
          this.teamIdsInDraft = new Set(inDraft.map((team) => team.id));

          this.applyTradesResponse(trades);

          // Rosters come from the tournament, not the tier list: who holds what
          // depends on this tournament's approved trades, and the same tier
          // list can back several tournaments.
          this.teams = inDraft
            .map((team) => ({
              id: team.id,
              name: team.teamName,
              coachName: team.coachName,
              roster: team.roster
                .map((pokemon) => ({
                  id: pokemon.id,
                  name: pokemon.name,
                  cost: pokemon.cost ?? 0,
                  tier: pokemon.tier ?? '—',
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          // Only this pool's rosters: pools draft the tier list independently,
          // so a Pokémon another pool took is still a free agent here.
          const drafted = new Set(
            inDraft.flatMap((team) => team.roster.map((p) => p.id)),
          );

          const freeAgents: TradeOption[] = [];
          for (const tier of tierList?.tierList ?? []) {
            if (tier.cost === undefined) continue;
            for (const pokemon of tier.pokemon) {
              if (pokemon.draftBanned || drafted.has(pokemon.id)) continue;
              freeAgents.push({
                id: pokemon.id,
                name: pokemon.name,
                cost: tier.cost,
                tier: tier.name,
              });
            }
          }
          this.freeAgents = freeAgents.sort((a, b) =>
            a.name.localeCompare(b.name),
          );

          this.refreshOptions('side1');
          this.refreshOptions('side2');
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private applyTradesResponse(trades: {
    rounds: { name: string; trades: TradeLog[] }[];
    currentRoundIndex: number;
    tradePoints?: { limit: number | null; byTeam: TeamSpend[] };
  }): void {
    this.roundNames = trades.rounds.map((round) => round.name);
    this.currentRoundIndex = Math.max(trades.currentRoundIndex ?? 0, 0);
    this.roundIndex = Math.min(
      this.currentRoundIndex,
      Math.max(this.roundNames.length - 1, 0),
    );
    this.rounds = trades.rounds
      .map((round) => ({
        ...round,
        trades: round.trades.filter((trade) => this.inThisDraft(trade)),
      }))
      .filter((round) => round.trades.length)
      .reverse();
    this.tradePointLimit = trades.tradePoints?.limit ?? null;
    this.spentByTeam = (trades.tradePoints?.byTeam ?? []).filter((entry) =>
      this.teamIdsInDraft.has(entry.teamId),
    );
  }

  /**
   * Trades are tournament-wide, so the response carries every pool's. A trade
   * belongs to this page if a team from this pool is on either side — the
   * other side may be free agency, which has no team.
   */
  private inThisDraft(trade: TradeLog): boolean {
    return [trade.side1, trade.side2].some(
      (side) => side.team && this.teamIdsInDraft.has(side.team.id),
    );
  }

  side(key: SideKey): SideState {
    return key === 'side1' ? this.side1 : this.side2;
  }

  onTeamChange(key: SideKey, teamId: string): void {
    const side = this.side(key);
    side.teamId = teamId;
    side.picks = [];
    if (teamId === FREE_AGENCY) side.tradePoints = 0;
    this.refreshOptions(key);
  }

  onTradePointsChange(key: SideKey, value: string): void {
    const parsed = Number(value);
    this.side(key).tradePoints = Number.isFinite(parsed)
      ? Math.max(0, Math.trunc(parsed))
      : 0;
  }

  addPick(key: SideKey, option: DraftPokemon): void {
    const side = this.side(key);
    const pool = this.poolFor(key);
    const match = pool.find((p) => p.id === option.id);
    if (!match || side.picks.some((p) => p.id === option.id)) return;
    side.picks = [...side.picks, match];
    this.refreshOptions(key);
  }

  removePick(key: SideKey, id: string): void {
    const side = this.side(key);
    side.picks = side.picks.filter((p) => p.id !== id);
    this.refreshOptions(key);
  }

  private poolFor(key: SideKey): TradeOption[] {
    const side = this.side(key);
    if (!side.teamId) return [];
    if (side.teamId === FREE_AGENCY) return this.freeAgents;
    return this.teams.find((team) => team.id === side.teamId)?.roster ?? [];
  }

  private refreshOptions(key: SideKey): void {
    const side = this.side(key);
    const taken = new Set(side.picks.map((p) => p.id));
    side.options$.next(this.poolFor(key).filter((p) => !taken.has(p.id)));
  }

  sideCost(key: SideKey): number {
    return this.side(key).picks.reduce((total, p) => total + p.cost, 0);
  }

  spentFor(teamId: string): number {
    return this.spentByTeam.find((e) => e.teamId === teamId)?.spent ?? 0;
  }

  /** Projected spend if the staged trade were approved as entered. */
  projectedFor(key: SideKey): number | null {
    const side = this.side(key);
    if (!side.teamId || side.teamId === FREE_AGENCY) return null;
    return this.spentFor(side.teamId) + side.tradePoints;
  }

  overLimit(key: SideKey): boolean {
    const projected = this.projectedFor(key);
    return (
      this.tradePointLimit !== null &&
      projected !== null &&
      projected > this.tradePointLimit
    );
  }

  get canSubmit(): boolean {
    const bothChosen = Boolean(this.side1.teamId && this.side2.teamId);
    const notBothFree = !(
      this.side1.teamId === FREE_AGENCY && this.side2.teamId === FREE_AGENCY
    );
    const distinct =
      this.side1.teamId !== this.side2.teamId ||
      this.side1.teamId === FREE_AGENCY;
    const hasPokemon = this.side1.picks.length > 0 || this.side2.picks.length > 0;
    return (
      !this.submitting &&
      bothChosen &&
      notBothFree &&
      distinct &&
      hasPokemon &&
      !this.overLimit('side1') &&
      !this.overLimit('side2')
    );
  }

  submitTrade(): void {
    if (!this.canSubmit) return;

    this.submitting = true;
    this.submitError = '';

    this.leagueService
      .sendTrade({
        side1: this.payloadFor('side1'),
        side2: this.payloadFor('side2'),
        roundIndex: this.roundIndex,
      })
      .pipe(
        take(1),
        finalize(() => {
          this.submitting = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.refreshTrades();
        },
        error: (err) => {
          this.submitError = err?.message || 'Could not submit the trade.';
        },
      });
  }

  private payloadFor(key: SideKey) {
    const side = this.side(key);
    const isFreeAgency = side.teamId === FREE_AGENCY;
    return {
      team: isFreeAgency ? undefined : side.teamId,
      pokemon: side.picks.map((p) => ({ id: p.id, tera: false })),
      tradePoints: isFreeAgency ? 0 : side.tradePoints,
    };
  }

  resolveTrade(trade: TradeLog, status: Exclude<TradeStatus, 'PENDING'>): void {
    if (!trade.id || this.resolvingTradeId) return;

    const tradeId = trade.id;
    this.resolvingTradeId = tradeId;
    this.resolveErrorById[tradeId] = '';

    this.leagueService
      .setTradeStatus(tradeId, status)
      .pipe(
        take(1),
        finalize(() => {
          this.resolvingTradeId = null;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.refreshTrades(),
        error: (err) => {
          this.resolveErrorById[tradeId] =
            err?.message || `Could not ${status.toLowerCase()} the trade.`;
        },
      });
  }

  private refreshTrades(): void {
    this.leagueService
      .getTrades()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((trades) => this.applyTradesResponse(trades));
  }

  private resetForm(): void {
    this.side1 = this.blankSide();
    this.side2 = this.blankSide();
    this.submitError = '';
  }

  teamName(teamId: string): string {
    if (teamId === FREE_AGENCY) return 'Free Agency';
    return this.teams.find((team) => team.id === teamId)?.name ?? '';
  }
}
