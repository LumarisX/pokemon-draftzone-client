import { Injectable, inject, signal, computed } from '@angular/core';
import { WebSocketService } from '../ws.service';
import { LeagueZoneService } from './league-zone.service';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import {
  LeagueTierGroup,
  TierPokemon,
} from '../../interfaces/tier-pokemon.interface';
import { Type, TYPES } from '../../data';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class LeagueTierListService {
  private wsService = inject(WebSocketService);
  private leagueService = inject(LeagueZoneService);
  private unsubscribe$ = new Subject<void>();

  readonly SortOptions = [
    'Name',
    'BST',
    'HP',
    'ATK',
    'DEF',
    'SPA',
    'SPD',
    'SPE',
  ] as const;

  drafted = signal<{ [division: string]: { pokemonId: string }[] }>({});
  types = TYPES;

  selectedTypes = signal<Type[]>([]);
  filteredTypes = signal<Type[]>([...this.types]);

  tierGroups = signal<LeagueTierGroup[] | undefined>(undefined);

  sortBy = signal<(typeof this.SortOptions)[number]>('BST');
  selectedDivision = signal<string | undefined>(undefined);

  readonly sortedTierGroups = computed(() => {
    const sortBy = this.sortBy();
    const tierGroups = this.tierGroups();
    if (!tierGroups) return null;

    const sortMap: Record<
      (typeof this.SortOptions)[number],
      (x: TierPokemon, y: TierPokemon) => number
    > = {
      BST: (x, y) => y.bst - x.bst,
      HP: (x, y) => y.stats.hp - x.stats.hp,
      ATK: (x, y) => y.stats.atk - x.stats.atk,
      DEF: (x, y) => y.stats.def - x.stats.def,
      SPA: (x, y) => y.stats.spa - x.stats.spa,
      SPD: (x, y) => y.stats.spd - x.stats.spd,
      SPE: (x, y) => y.stats.spe - x.stats.spe,
      Name: (x, y) => x.id.localeCompare(y.id),
    };

    return tierGroups.map((group) => ({
      ...group,
      tiers: group.tiers.map((tier) => ({
        ...tier,
        pokemon: [...tier.pokemon].sort(sortMap[sortBy]),
      })),
    }));
  });

  readonly draftedPokemonIdsForSelectedDivision = computed(() => {
    const selectedDivision = this.selectedDivision();
    if (!selectedDivision) return new Set<string>();
    const drafted = this.drafted();
    const draftedIds = new Set(
      drafted[selectedDivision]?.map((p) => p.pokemonId) || [],
    );
    return draftedIds;
  });

  constructor() {}

  initialize(leagueId: string): void {
    this.leagueService
      .getTierList(leagueId)
      .pipe(first())
      .subscribe((data) => {
        this.drafted.set(data.divisions);
        this.tierGroups.set(data.tierList);
        const divisionNames = Object.keys(data.divisions);
        if (divisionNames.length > 0) {
          this.selectedDivision.set(divisionNames[0]);
        }
      });

    this.wsService
      .on<{ division: string; pokemonId: string }>('league.draft.added')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        console.log('league.draft.added', data);
        const currentDrafted = this.drafted();
        if (currentDrafted[data.division]) {
          const updatedDivisionDrafts = [
            ...currentDrafted[data.division],
            { pokemonId: data.pokemonId },
          ];

          this.drafted.set({
            ...currentDrafted,
            [data.division]: updatedDivisionDrafts,
          });
        }
      });
  }

  private destroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateFilter(selected: boolean, index?: number) {
    if (index === undefined) {
      if (selected) {
        this.selectedTypes.set([...this.types]);
      } else {
        this.selectedTypes.set([]);
      }
      return;
    }
    if (selected) {
      this.selectedTypes.update((types) => [...types, this.types[index]]);
    } else {
      this.selectedTypes.update((types) =>
        types.filter((type) => type !== this.types[index]),
      );
    }
  }

  applyFilter() {
    this.filteredTypes.set([...this.selectedTypes()]);
  }

  public typeInFilter(pokemon: TierPokemon): boolean {
    if (this.filteredTypes().length === 0) return true;
    return pokemon.types.some((type) => this.filteredTypes().includes(type));
  }

  makeBanString(banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  }): string {
    if (!banned) return '';
    const bans: string[] = [];
    if (banned.tera) bans.push('Terastalization');
    if (banned.abilities && banned.abilities.length > 0)
      bans.push(...banned.abilities);
    if (banned.moves && banned.moves.length > 0) bans.push(...banned.moves);
    return 'Banned: ' + bans.join(', ');
  }

  // isDrafted(pokemonId: string): boolean {
  //   if (!this.selectedDivision.value) return false;
  //   const drafted = this.drafted();
  //   return drafted[this.selectedDivision.value].some(
  //     (drafted) => drafted.pokemonId === pokemonId,
  //   );
  // }
}
