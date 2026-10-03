import { NgTemplateOutlet } from '@angular/common';
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
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  PokemonSearchComponent,
  PokemonSearchOption,
} from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { BehaviorSubject, catchError, forkJoin, of } from 'rxjs';

export interface TradeProposeDialogData {
  teamId: string;
  teamName: string;
  roster: League.LeaguePokemon[];
  rosterCost: number;
  pointTotal?: number;
  roundIndex: number;
  roundName?: string;
}

export interface TradeProposeDialogResult {
  send: { id: string; tera: boolean }[];
  receive: { id: string; tera: boolean }[];
  roundIndex: number;
}

type TradeOption = PokemonSearchOption & { cost: number; tier: string };

const sumCost = (options: TradeOption[]) =>
  options.reduce((total, pokemon) => total + pokemon.cost, 0);

@Component({
  selector: 'pdz-trade-propose-dialog',
  imports: [
    ButtonComponent,
    IconComponent,
    LoadingComponent,
    NgTemplateOutlet,
    PokemonSearchComponent,
    SpriteComponent,
  ],
  templateUrl: './trade-propose-dialog.component.html',
  styleUrl: './trade-propose-dialog.component.scss',
})
export class TradeProposeDialogComponent implements OnInit {
  private readonly tierListService = inject(TierListService);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<TradeProposeDialogResult>;
  readonly data = inject<TradeProposeDialogData>(DIALOG_DATA);

  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly sendOptions$ = new BehaviorSubject<DraftPokemon[]>([]);
  readonly receiveOptions$ = new BehaviorSubject<DraftPokemon[]>([]);

  readonly send = signal<TradeOption[]>([]);
  readonly receive = signal<TradeOption[]>([]);

  private readonly roster = signal<TradeOption[]>([]);
  private readonly freeAgents = signal<TradeOption[]>([]);

  readonly sendCost = computed(() => sumCost(this.send()));
  readonly receiveCost = computed(() => sumCost(this.receive()));
  readonly costDelta = computed(() => this.receiveCost() - this.sendCost());
  readonly newRosterCost = computed(
    () => this.data.rosterCost + this.costDelta(),
  );
  readonly overBudget = computed(
    () =>
      this.data.pointTotal !== undefined &&
      this.newRosterCost() > this.data.pointTotal,
  );
  readonly canSubmit = computed(
    () =>
      !this.loading() && (this.send().length > 0 || this.receive().length > 0),
  );

  constructor() {
    effect(() => {
      const sent = new Set(this.send().map((p) => p.id));
      const received = new Set(this.receive().map((p) => p.id));
      this.sendOptions$.next(this.roster().filter((p) => !sent.has(p.id)));
      this.receiveOptions$.next(
        this.freeAgents().filter((p) => !received.has(p.id)),
      );
    });
  }

  ngOnInit(): void {
    forkJoin({
      tierList: this.tierListService
        .getTierList()
        .pipe(catchError(() => of(null))),
      teams: this.leagueService
        .getTournamentTeams()
        .pipe(catchError(() => of({ teams: [] }))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ tierList, teams }) => {
        if (!tierList) {
          this.loadError.set('Could not load the tier list.');
          this.loading.set(false);
          return;
        }

        const costById = new Map<string, { cost: number; tier: string }>();
        const ownPoolSlug =
          teams.teams.find((team) => team.id === this.data.teamId)?.pool
            ?.poolSlug ?? null;
        const drafted = new Set(
          teams.teams
            .filter((team) => (team.pool?.poolSlug ?? null) === ownPoolSlug)
            .flatMap((team) => team.roster.map((p) => p.id)),
        );

        const freeAgents: TradeOption[] = [];
        for (const tier of tierList.tierList) {
          if (tier.cost === undefined) continue;
          for (const pokemon of tier.pokemon) {
            costById.set(pokemon.id, { cost: tier.cost, tier: tier.name });
            if (pokemon.draftBanned || drafted.has(pokemon.id)) continue;
            freeAgents.push({
              id: pokemon.id,
              name: pokemon.name,
              cost: tier.cost,
              tier: tier.name,
            });
          }
        }

        this.roster.set(
          this.data.roster.map((pokemon) => ({
            id: pokemon.id,
            name: pokemon.name,
            cost: costById.get(pokemon.id)?.cost ?? pokemon.cost ?? 0,
            tier: costById.get(pokemon.id)?.tier ?? pokemon.tier ?? '—',
          })),
        );
        this.freeAgents.set(
          freeAgents.sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.loading.set(false);
      });
  }

  addSend(option: DraftPokemon): void {
    const match = this.roster().find((p) => p.id === option.id);
    if (!match || this.send().some((p) => p.id === option.id)) return;
    this.send.update((list) => [...list, match]);
  }

  addReceive(option: DraftPokemon): void {
    const match = this.freeAgents().find((p) => p.id === option.id);
    if (!match || this.receive().some((p) => p.id === option.id)) return;
    this.receive.update((list) => [...list, match]);
  }

  remove(side: 'team1' | 'team2', id: string): void {
    const list = side === 'team1' ? this.send : this.receive;
    list.update((picks) => picks.filter((p) => p.id !== id));
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.ref.close({
      send: this.send().map((p) => ({ id: p.id, tera: false })),
      receive: this.receive().map((p) => ({ id: p.id, tera: false })),
      roundIndex: this.data.roundIndex,
    });
  }
}
