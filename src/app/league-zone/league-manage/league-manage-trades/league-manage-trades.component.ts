import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { LoadingComponent } from '../../../images/loading/loading.component';

interface TradeGroup {
  id: string;
  name: string;
  team?: { id: string; name: string; coachName: string };
}

interface TradePokemon {
  id: string;
  name: string;
  cost: number;
  team?: { id: string; name: string; coachName: string };
}

export interface TradeData {
  side1: {
    team?: string;
    pokemon: { id: string }[];
  };
  side2: {
    team?: string;
    pokemon: { id: string }[];
  };
  stage: number;
}

@Component({
  selector: 'pdz-league-manage-trades',
  imports: [ReactiveFormsModule, FormsModule, LoadingComponent],
  templateUrl: './league-manage-trades.component.html',
  styleUrl: './league-manage-trades.component.scss',
})
export class LeagueManageTradesComponent implements OnInit {
  private leagueService = inject(LeagueZoneService);
  private fb = inject(FormBuilder);

  // Groups derived from teams in pokemon list
  loading = true;
  groups = signal<TradeGroup[]>([]);

  // Map of group id to pokemon in that group
  private pokemonByGroup = signal(new Map<string, TradePokemon[]>());

  // Search queries for each side
  side1SearchQuery = signal<string>('');
  side2SearchQuery = signal<string>('');

  // Form group
  tradeForm = this.fb.group({
    side1Group: ['', Validators.required],
    side1Pokemon: [[] as string[]],
    side2Group: ['', Validators.required],
    side2Pokemon: [[] as string[]],
    stage: [1, Validators.required],
  });

  // Stage options (Week 1 through Week 8)
  stageOptions = Array.from({ length: 8 }, (_, i) => i);

  getGroupPokemon(side: 'side1' | 'side2'): TradePokemon[] {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    const map = this.pokemonByGroup();
    const allPokemon = groupId ? map.get(groupId) || [] : [];

    // Filter by search query
    const searchQuery = (
      side === 'side1' ? this.side1SearchQuery() : this.side2SearchQuery()
    )
      .toLowerCase()
      .trim();
    if (!searchQuery) {
      return allPokemon;
    }

    return allPokemon.filter((pokemon) =>
      pokemon.id.toLowerCase().includes(searchQuery),
    );
  }

  updateSearchQuery(side: 'side1' | 'side2', query: string): void {
    if (side === 'side1') {
      this.side1SearchQuery.set(query);
    } else {
      this.side2SearchQuery.set(query);
    }
  }

  ngOnInit(): void {
    this.leagueService.getPokemonList().subscribe({
      next: (data) => {
        console.log('Raw pokemon list data:', data);
        this.loading = false;
        const normalized = Array.isArray(data)
          ? data
          : (data as { groups?: typeof data })?.groups || [];
        console.log('Normalized data:', normalized);
        this.buildGroupsAndMapping(normalized);
        console.log('Groups:', this.groups());
        console.log('Pokemon by group:', this.pokemonByGroup());
      },
      error: (err) => {
        console.error('Error fetching pokemon list:', err);
      },
    });
  }

  /**
   * Build groups from team data and create pokemon grouping map
   */
  private buildGroupsAndMapping(
    data: {
      pokemon: { id: string; name: string; cost?: number }[];
      team?: { id: string; name: string; coachName: string };
    }[],
  ): void {
    const groupMap = new Map<string, TradeGroup>();
    const pokemonMap = new Map<string, TradePokemon[]>();

    // Process each pokemon entry
    data.forEach((entry) => {
      const teamName = entry.team?.name || 'Free Agency';
      const groupId = entry.team?.id || 'free-agency';
      const pokemonList = entry.pokemon;

      // Create group if it doesn't exist
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          name: teamName,
          team: entry.team,
        });
        pokemonMap.set(groupId, []);
      }

      // Add pokemon to its group
      pokemonList.forEach((pokemon) => {
        pokemonMap.get(groupId)?.push({
          id: pokemon.id,
          name: pokemon.name,
          cost: pokemon.cost ?? -1,
          team: entry.team,
        });
      });
    });

    // Update signals
    this.groups.set(Array.from(groupMap.values()));
    this.pokemonByGroup.set(pokemonMap);
  }

  /**
   * Toggle pokemon selection for a side
   */
  togglePokemon(side: 'side1' | 'side2', pokemonId: string): void {
    const controlName = `${side}Pokemon`;
    const control = this.tradeForm.get(controlName);
    if (!control) return;

    const currentValue = Array.isArray(control.value) ? control.value : [];
    const next = new Set(currentValue);
    if (next.has(pokemonId)) {
      next.delete(pokemonId);
    } else {
      next.add(pokemonId);
    }

    control.setValue(Array.from(next));
  }

  /**
   * Check if pokemon is selected
   */
  isPokemonSelected(side: 'side1' | 'side2', pokemonId: string): boolean {
    const controlName = `${side}Pokemon`;
    const control = this.tradeForm.get(controlName);
    if (!control) return false;
    const currentValue = Array.isArray(control.value) ? control.value : [];
    return currentValue.includes(pokemonId);
  }

  /**
   * Get total cost for selected pokemon on a side
   */
  getSelectedTotalCost(side: 'side1' | 'side2'): number {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return 0;

    const selectedIds = this.tradeForm.get(`${side}Pokemon`)?.value as
      | string[]
      | null
      | undefined;
    if (!selectedIds?.length) return 0;

    const allPokemon = this.pokemonByGroup().get(groupId) || [];
    const selectedSet = new Set(selectedIds);

    return allPokemon
      .filter((pokemon) => selectedSet.has(pokemon.id))
      .reduce((total, pokemon) => total + (pokemon.cost || 0), 0);
  }

  getTotalCost(side: 'side1' | 'side2'): number {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return 0;

    const selectedIds = this.tradeForm.get(`${side}Pokemon`)?.value as
      | string[]
      | null
      | undefined;
    const selectedSet = new Set(selectedIds || []);

    const otherSide = side === 'side1' ? 'side2' : 'side1';
    const otherGroupId = this.tradeForm.get(`${otherSide}Group`)?.value;
    if (!otherGroupId) return 0;

    const otherSideIds = this.tradeForm.get(`${otherSide}Pokemon`)?.value as
      | string[]
      | null
      | undefined;
    const otherSelectedSet = new Set(otherSideIds || []);

    const allPokemon = this.pokemonByGroup().get(groupId) || [];
    const otherAllPokemon = this.pokemonByGroup().get(otherGroupId) || [];

    // Unselected on current side
    const unselectedCost = allPokemon
      .filter((pokemon) => !selectedSet.has(pokemon.id))
      .reduce((total, pokemon) => total + (pokemon.cost || 0), 0);

    // Selected on other side
    const otherSelectedCost = otherAllPokemon
      .filter((pokemon) => otherSelectedSet.has(pokemon.id))
      .reduce((total, pokemon) => total + (pokemon.cost || 0), 0);

    return unselectedCost + otherSelectedCost;
  }

  /**
   * Build and console log the trade data
   */
  submitTrade(): void {
    if (this.tradeForm.invalid) {
      console.warn('Trade form is invalid');
      return;
    }

    const side1GroupId = this.tradeForm.get('side1Group')?.value;
    const side2GroupId = this.tradeForm.get('side2Group')?.value;

    const tradeData: TradeData = {
      side1: {
        team:
          side1GroupId && side1GroupId !== 'free-agency'
            ? side1GroupId
            : undefined,
        pokemon: (this.tradeForm.get('side1Pokemon')?.value as string[]).map(
          (id) => ({ id }),
        ),
      },
      side2: {
        team:
          side2GroupId && side2GroupId !== 'free-agency'
            ? side2GroupId
            : undefined,
        pokemon: (this.tradeForm.get('side2Pokemon')?.value as string[]).map(
          (id) => ({ id }),
        ),
      },
      stage: this.tradeForm.get('stage')?.value ?? -1,
    };

    this.leagueService.sendTrade(tradeData).subscribe({
      next: (response) => {
        console.log('Trade submitted successfully:', response);
        this.swapPokemonOnClient(tradeData);
        this.resetTrade();
      },
      error: (err) => {
        console.error('Error submitting trade:', err);
      },
    });
  }

  private swapPokemonOnClient(tradeData: TradeData): void {
    const side1GroupId = tradeData.side1.team;
    const side2GroupId = tradeData.side2.team;

    if (!side1GroupId || !side2GroupId || side1GroupId === side2GroupId) {
      return;
    }

    const groupLookup = new Map(
      this.groups().map((group) => [group.id, group]),
    );
    const side1Group = groupLookup.get(side1GroupId);
    const side2Group = groupLookup.get(side2GroupId);

    const map = new Map(this.pokemonByGroup());
    const side1List = [...(map.get(side1GroupId) || [])];
    const side2List = [...(map.get(side2GroupId) || [])];

    const side1Ids = new Set(
      tradeData.side1.pokemon.map((pokemon) => pokemon.id),
    );
    const side2Ids = new Set(
      tradeData.side2.pokemon.map((pokemon) => pokemon.id),
    );

    const side1Selected: TradePokemon[] = [];
    const side2Selected: TradePokemon[] = [];

    const nextSide1List: TradePokemon[] = [];
    side1List.forEach((pokemon) => {
      if (side1Ids.has(pokemon.id)) {
        side1Selected.push(pokemon);
      } else {
        nextSide1List.push(pokemon);
      }
    });

    const nextSide2List: TradePokemon[] = [];
    side2List.forEach((pokemon) => {
      if (side2Ids.has(pokemon.id)) {
        side2Selected.push(pokemon);
      } else {
        nextSide2List.push(pokemon);
      }
    });

    const side1Team = side1Group?.team;
    const side2Team = side2Group?.team;

    const side1Incoming = side2Selected.map((pokemon) => ({
      ...pokemon,
      team: side1Team,
    }));
    const side2Incoming = side1Selected.map((pokemon) => ({
      ...pokemon,
      team: side2Team,
    }));

    map.set(side1GroupId, [...nextSide1List, ...side1Incoming]);
    map.set(side2GroupId, [...nextSide2List, ...side2Incoming]);
    this.pokemonByGroup.set(map);
  }

  /**
   * Reset the form
   */
  resetTrade(): void {
    const stage = this.tradeForm.get('stage')?.value || 0;
    this.side1SearchQuery.set('');
    this.side2SearchQuery.set('');
    this.tradeForm.get('stage')?.setValue(stage);
    this.tradeForm.get('side1Pokemon')?.setValue([]);
    this.tradeForm.get('side2Pokemon')?.setValue([]);
  }
}
