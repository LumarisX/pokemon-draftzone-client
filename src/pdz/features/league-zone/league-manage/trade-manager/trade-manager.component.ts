import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LEAGUE_ZONE_MANAGE_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { PoolSwitcherComponent } from '@pdz/features/league-zone/league-widgets/pool-switcher/pool-switcher.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import {
  TradeLog,
  TradeStatus,
} from '@pdz/features/league-zone/league.interface';
import { TradeCardComponent } from '@pdz/features/league-zone/trade-card/trade-card.component';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';

const FREE_AGENCY = 'free-agency';

type TradeOption = DraftPokemon & { cost: number; tier: string };

type SideKey = 'side1' | 'side2';

interface SideDraft {
  teamId: string;
  picks: TradeOption[];
  tradePoints: number;
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

interface TradesResponse {
  rounds: { name: string; trades: TradeLog[] }[];
  currentRoundIndex: number;
  tradePoints?: { limit: number | null; byTeam: TeamSpend[] };
}

const BLANK_SIDE: SideDraft = { teamId: '', picks: [], tradePoints: 0 };

@Component({
  selector: 'pdz-trade-manager',
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    PokemonSearchComponent,
    PoolSwitcherComponent,
    SelectComponent,
    SelectOptionComponent,
    PokemonComponent,
    TradeCardComponent,
  ],
  templateUrl: './trade-manager.component.html',
  styleUrl: './trade-manager.component.scss',
})
export class TradeManagerComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly tierListService = inject(TierListService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly sideKeys: SideKey[] = ['side1', 'side2'];
  readonly freeAgency = FREE_AGENCY;

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly resolvingTradeId = signal<string | null>(null);
  readonly resolveErrors = signal<Record<string, string>>({});

  readonly poolSlug = signal<string | null>(null);
  readonly noPools = signal(false);

  readonly teams = signal<ManagedTeam[]>([]);
  readonly rounds = signal<{ name: string; trades: TradeLog[] }[]>([]);
  readonly roundNames = signal<string[]>([]);
  readonly currentRoundIndex = signal(0);
  readonly roundIndex = signal(0);
  readonly tradePointLimit = signal<number | null>(null);
  readonly spentByTeam = signal<TeamSpend[]>([]);

  private readonly freeAgents = signal<TradeOption[]>([]);
  private teamIdsInPool = new Set<string>();

  readonly sides = signal<Record<SideKey, SideDraft>>({
    side1: BLANK_SIDE,
    side2: BLANK_SIDE,
  });

  readonly options: Record<SideKey, BehaviorSubject<DraftPokemon[]>> = {
    side1: new BehaviorSubject<DraftPokemon[]>([]),
    side2: new BehaviorSubject<DraftPokemon[]>([]),
  };

  readonly signUpsPath = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueService.leagueSlug(),
    'tournaments',
    this.leagueService.tournamentSlug(),
    LEAGUE_ZONE_MANAGE_PATH,
    'sign-ups',
  ]);

  readonly canSubmit = computed(() => {
    const { side1, side2 } = this.sides();
    const bothChosen = Boolean(side1.teamId && side2.teamId);
    const notBothFree = !(
      side1.teamId === FREE_AGENCY && side2.teamId === FREE_AGENCY
    );
    const distinct =
      side1.teamId !== side2.teamId || side1.teamId === FREE_AGENCY;
    const hasPokemon = side1.picks.length > 0 || side2.picks.length > 0;
    return (
      !this.submitting() &&
      bothChosen &&
      notBothFree &&
      distinct &&
      hasPokemon &&
      !this.overLimit('side1') &&
      !this.overLimit('side2')
    );
  });

  constructor() {
    effect(() => {
      for (const key of this.sideKeys) {
        const side = this.sides()[key];
        const taken = new Set(side.picks.map((pick) => pick.id));
        this.options[key].next(
          this.poolFor(side.teamId).filter((pick) => !taken.has(pick.id)),
        );
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('poolSlug')),
        distinctUntilChanged(),
        switchMap((routePoolSlug) =>
          routePoolSlug
            ? of(routePoolSlug)
            : this.leagueService
                .getLeagueInfo()
                .pipe(map((info) => info.pools[0]?.poolSlug ?? null)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((poolSlug) => {
        this.poolSlug.set(poolSlug);
        this.noPools.set(!poolSlug);
        if (poolSlug) this.load(poolSlug);
        else this.loading.set(false);
      });
  }

  onPoolSelected(poolSlug: string): void {
    this.router.navigate([
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueService.leagueSlug(),
      'tournaments',
      this.leagueService.tournamentSlug(),
      LEAGUE_ZONE_MANAGE_PATH,
      'pools',
      poolSlug,
      'trades',
    ]);
  }

  side(key: SideKey): SideDraft {
    return this.sides()[key];
  }

  onTeamChange(key: SideKey, teamId: string): void {
    this.updateSide(key, (side) => ({
      teamId,
      picks: [],
      tradePoints: teamId === FREE_AGENCY ? 0 : side.tradePoints,
    }));
  }

  onTradePointsChange(key: SideKey, value: string): void {
    const parsed = Number(value);
    const tradePoints = Number.isFinite(parsed)
      ? Math.max(0, Math.trunc(parsed))
      : 0;
    this.updateSide(key, (side) => ({ ...side, tradePoints }));
  }

  addPick(key: SideKey, option: DraftPokemon): void {
    const side = this.side(key);
    const match = this.poolFor(side.teamId).find((p) => p.id === option.id);
    if (!match || side.picks.some((p) => p.id === option.id)) return;
    this.updateSide(key, (current) => ({
      ...current,
      picks: [...current.picks, match],
    }));
  }

  removePick(key: SideKey, id: string): void {
    this.updateSide(key, (side) => ({
      ...side,
      picks: side.picks.filter((p) => p.id !== id),
    }));
  }

  sideCost(key: SideKey): number {
    return this.side(key).picks.reduce((total, p) => total + p.cost, 0);
  }

  spentFor(teamId: string): number {
    return this.spentByTeam().find((e) => e.teamId === teamId)?.spent ?? 0;
  }

  projectedFor(key: SideKey): number | null {
    const side = this.side(key);
    if (!side.teamId || side.teamId === FREE_AGENCY) return null;
    return this.spentFor(side.teamId) + side.tradePoints;
  }

  overLimit(key: SideKey): boolean {
    const projected = this.projectedFor(key);
    const limit = this.tradePointLimit();
    return limit !== null && projected !== null && projected > limit;
  }

  isOverLimit(spent: number): boolean {
    const limit = this.tradePointLimit();
    return limit !== null && spent > limit;
  }

  submitTrade(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.submitError.set('');

    this.leagueService
      .sendTrade({
        side1: this.payloadFor('side1'),
        side2: this.payloadFor('side2'),
        roundIndex: this.roundIndex(),
      })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.refreshTrades();
        },
        error: (err) =>
          this.submitError.set(err?.message || 'Could not submit the trade.'),
      });
  }

  resolveTrade(trade: TradeLog, status: Exclude<TradeStatus, 'PENDING'>): void {
    this.patchTrade(trade, { status });
  }

  changeRound(trade: TradeLog, activeRound: number): void {
    if (activeRound === trade.activeRound) return;
    this.patchTrade(trade, { activeRound });
  }

  resolveError(trade: TradeLog): string {
    return trade.id ? (this.resolveErrors()[trade.id] ?? '') : '';
  }

  private updateSide(key: SideKey, change: (side: SideDraft) => SideDraft) {
    this.sides.update((sides) => ({ ...sides, [key]: change(sides[key]) }));
  }

  private poolFor(teamId: string): TradeOption[] {
    if (!teamId) return [];
    if (teamId === FREE_AGENCY) return this.freeAgents();
    return this.teams().find((team) => team.id === teamId)?.roster ?? [];
  }

  private load(poolSlug: string): void {
    this.loading.set(true);
    this.resetForm();

    forkJoin({
      tierList: this.tierListService
        .getTierList()
        .pipe(catchError(() => of(null))),
      teams: this.leagueService
        .getTournamentTeams()
        .pipe(catchError(() => of({ teams: [] }))),
      trades: this.leagueService.getTrades(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.loading.set(false);
          this.toast.error('Could not load the trades.');
        },
        next: ({ tierList, teams, trades }) => {
          const inPool = teams.teams.filter(
            (team) => team.pool?.poolSlug === poolSlug,
          );
          this.teamIdsInPool = new Set(inPool.map((team) => team.id));
          this.applyTradesResponse(trades);

          this.teams.set(
            inPool
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
              .sort((a, b) => a.name.localeCompare(b.name)),
          );

          const drafted = new Set(
            inPool.flatMap((team) => team.roster.map((p) => p.id)),
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
          this.freeAgents.set(
            freeAgents.sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.loading.set(false);
        },
      });
  }

  private applyTradesResponse(trades: TradesResponse): void {
    const roundNames = trades.rounds.map((round) => round.name);
    const currentRoundIndex = Math.max(trades.currentRoundIndex ?? 0, 0);
    this.roundNames.set(roundNames);
    this.currentRoundIndex.set(currentRoundIndex);
    this.roundIndex.set(
      Math.min(currentRoundIndex, Math.max(roundNames.length - 1, 0)),
    );
    this.rounds.set(
      trades.rounds
        .map((round) => ({
          ...round,
          trades: round.trades.filter((trade) => this.inThisPool(trade)),
        }))
        .filter((round) => round.trades.length)
        .reverse(),
    );
    this.tradePointLimit.set(trades.tradePoints?.limit ?? null);
    this.spentByTeam.set(
      (trades.tradePoints?.byTeam ?? []).filter((entry) =>
        this.teamIdsInPool.has(entry.teamId),
      ),
    );
  }

  private inThisPool(trade: TradeLog): boolean {
    return [trade.side1, trade.side2].some(
      (side) => side.team && this.teamIdsInPool.has(side.team.id),
    );
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

  private patchTrade(
    trade: TradeLog,
    patch: { status?: Exclude<TradeStatus, 'PENDING'>; activeRound?: number },
  ): void {
    if (!trade.id || this.resolvingTradeId()) return;

    const tradeId = trade.id;
    this.resolvingTradeId.set(tradeId);
    this.setResolveError(tradeId, '');

    this.leagueService
      .updateTrade(tradeId, patch)
      .pipe(
        finalize(() => this.resolvingTradeId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.refreshTrades(),
        error: (err) =>
          this.setResolveError(
            tradeId,
            err?.message ||
              (patch.status
                ? `Could not ${patch.status.toLowerCase()} the trade.`
                : 'Could not move the trade.'),
          ),
      });
  }

  private setResolveError(tradeId: string, message: string): void {
    this.resolveErrors.update((errors) => ({ ...errors, [tradeId]: message }));
  }

  private refreshTrades(): void {
    this.leagueService
      .getTrades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((trades) => this.applyTradesResponse(trades));
  }

  private resetForm(): void {
    this.sides.set({ side1: BLANK_SIDE, side2: BLANK_SIDE });
    this.submitError.set('');
  }
}
