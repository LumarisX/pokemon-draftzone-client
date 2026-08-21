import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import {
  PokemonSearchComponent,
  PokemonSearchOption,
} from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { BehaviorSubject, catchError, forkJoin, of, take } from 'rxjs';
import { League } from '../../league.interface';
import { LeagueZoneService } from '../../league-zone.service';

export interface TradeProposeDialogData {
  teamId: string;
  teamName: string;
  roster: League.LeaguePokemon[];
  /** Current roster cost, used with pointTotal for the budget check. */
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

@Component({
  selector: 'pdz-trade-propose-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonComponent,
    PokemonSearchComponent,
    SpriteComponent,
    IconComponent,
    LoadingComponent,
  ],
  templateUrl: './trade-propose-dialog.component.html',
  styleUrl: './trade-propose-dialog.component.scss',
})
export class TradeProposeDialogComponent implements OnInit {
  private readonly tierListService = inject(TierListService);
  private readonly leagueService = inject(LeagueZoneService);
  dialogRef =
    inject<
      MatDialogRef<TradeProposeDialogComponent, TradeProposeDialogResult | null>
    >(MatDialogRef);
  data = inject<TradeProposeDialogData>(MAT_DIALOG_DATA);

  loading = true;
  loadError = '';

  /** The coach's own roster, minus anything already staged to send. */
  sendOptions$ = new BehaviorSubject<DraftPokemon[]>([]);
  /** Undrafted tier-list Pokémon, minus anything already staged to receive. */
  receiveOptions$ = new BehaviorSubject<DraftPokemon[]>([]);

  send: TradeOption[] = [];
  receive: TradeOption[] = [];

  private roster: TradeOption[] = [];
  private freeAgents: TradeOption[] = [];

  ngOnInit(): void {
    forkJoin({
      // Which Pokémon are still free is a tournament question, not a tier-list
      // one — the tier list is shared and says nothing about who holds what.
      tierList: this.tierListService.getTierList().pipe(
        take(1),
        catchError(() => of(null)),
      ),
      teams: this.leagueService.getTournamentTeams().pipe(
        take(1),
        catchError(() => of({ teams: [] })),
      ),
    }).subscribe(({ tierList: data, teams }) => {
      if (!data) {
        this.loadError = 'Could not load the tier list.';
        this.loading = false;
        return;
      }

      const costById = new Map<string, { cost: number; tier: string }>();
      const drafted = new Set(
        teams.teams.flatMap((team) => team.roster.map((p) => p.id)),
      );

      const freeAgents: TradeOption[] = [];
      for (const tier of data.tierList) {
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

      this.roster = this.data.roster.map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name,
        cost: costById.get(pokemon.id)?.cost ?? pokemon.cost ?? 0,
        tier: costById.get(pokemon.id)?.tier ?? pokemon.tier ?? '—',
      }));
      this.freeAgents = freeAgents.sort((a, b) => a.name.localeCompare(b.name));

      this.refreshOptions();
      this.loading = false;
    });
  }

  get sendCost(): number {
    return this.send.reduce((total, pokemon) => total + pokemon.cost, 0);
  }

  get receiveCost(): number {
    return this.receive.reduce((total, pokemon) => total + pokemon.cost, 0);
  }

  get costDelta(): number {
    return this.receiveCost - this.sendCost;
  }

  get newRosterCost(): number {
    return this.data.rosterCost + this.costDelta;
  }

  get overBudget(): boolean {
    return (
      this.data.pointTotal !== undefined &&
      this.newRosterCost > this.data.pointTotal
    );
  }

  get canSubmit(): boolean {
    return !this.loading && (this.send.length > 0 || this.receive.length > 0);
  }

  addSend(option: DraftPokemon): void {
    const match = this.roster.find((p) => p.id === option.id);
    if (!match || this.send.some((p) => p.id === option.id)) return;
    this.send = [...this.send, match];
    this.refreshOptions();
  }

  addReceive(option: DraftPokemon): void {
    const match = this.freeAgents.find((p) => p.id === option.id);
    if (!match || this.receive.some((p) => p.id === option.id)) return;
    this.receive = [...this.receive, match];
    this.refreshOptions();
  }

  removeSend(id: string): void {
    this.send = this.send.filter((p) => p.id !== id);
    this.refreshOptions();
  }

  removeReceive(id: string): void {
    this.receive = this.receive.filter((p) => p.id !== id);
    this.refreshOptions();
  }

  private refreshOptions(): void {
    const sent = new Set(this.send.map((p) => p.id));
    const received = new Set(this.receive.map((p) => p.id));
    this.sendOptions$.next(this.roster.filter((p) => !sent.has(p.id)));
    this.receiveOptions$.next(
      this.freeAgents.filter((p) => !received.has(p.id)),
    );
  }

  onSubmit(): void {
    if (!this.canSubmit) return;
    this.dialogRef.close({
      send: this.send.map((p) => ({ id: p.id, tera: false })),
      receive: this.receive.map((p) => ({ id: p.id, tera: false })),
      roundIndex: this.data.roundIndex,
    });
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }
}
