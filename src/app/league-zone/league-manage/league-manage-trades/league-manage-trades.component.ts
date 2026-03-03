import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { TierPokemonAddon } from '../../../interfaces/tier-pokemon.interface';
import { RouterModule } from '@angular/router';

interface TradeGroup {
  id: string;
  name: string;
  team?: { id: string; name: string; coachName: string };
}

interface TradePokemon {
  id: string;
  name: string;
  cost?: number;
  team?: { id: string; name: string; coachName: string };
  tera: boolean;
  addons?: TierPokemonAddon[];
}

type SelectedTradePokemon = { id: string; tera: boolean };

export interface TradeData {
  side1: {
    team?: string;
    pokemon: SelectedTradePokemon[];
  };
  side2: {
    team?: string;
    pokemon: SelectedTradePokemon[];
  };
  stage: number;
}

@Component({
  selector: 'pdz-league-manage-trades',
  imports: [ReactiveFormsModule, FormsModule, LoadingComponent, RouterModule],
  templateUrl: './league-manage-trades.component.html',
  styleUrl: './league-manage-trades.component.scss',
})
export class LeagueManageTradesComponent implements OnInit {
  private leagueService = inject(LeagueZoneService);
  private fb = inject(FormBuilder);

  loading = true;
  groups = signal<TradeGroup[]>([]);
  private pokemonByGroup = signal(new Map<string, TradePokemon[]>());

  side1SearchQuery = signal<string>('');
  side2SearchQuery = signal<string>('');

  tradeForm = this.fb.group({
    side1Group: ['', Validators.required],
    side1Pokemon: [[] as SelectedTradePokemon[]],
    side2Group: ['', Validators.required],
    side2Pokemon: [[] as SelectedTradePokemon[]],
    stage: [1, Validators.required],
  });

  stageOptions = Array.from({ length: 8 }, (_, i) => i);

  getGroupPokemon(side: 'side1' | 'side2'): TradePokemon[] {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    const map = this.pokemonByGroup();
    const allPokemon = groupId ? map.get(groupId) || [] : [];

    const searchQuery = (
      side === 'side1' ? this.side1SearchQuery() : this.side2SearchQuery()
    )
      .toLowerCase()
      .trim();

    if (!searchQuery) return allPokemon;

    return allPokemon.filter((pokemon) =>
      pokemon.id.toLowerCase().includes(searchQuery),
    );
  }

  updateSearchQuery(side: 'side1' | 'side2', query: string): void {
    if (side === 'side1') this.side1SearchQuery.set(query);
    else this.side2SearchQuery.set(query);
  }

  ngOnInit(): void {
    this.tradeForm.get('side1Group')?.valueChanges.subscribe(() => {
      this.side1SearchQuery.set('');
      this.tradeForm.get('side1Pokemon')?.setValue([]);
    });

    this.tradeForm.get('side2Group')?.valueChanges.subscribe(() => {
      this.side2SearchQuery.set('');
      this.tradeForm.get('side2Pokemon')?.setValue([]);
    });

    this.leagueService.getPokemonList().subscribe({
      next: (data) => {
        this.loading = false;
        this.buildGroupsAndMapping(data.groups || []);
      },
      error: (err) => {
        console.error('Error fetching pokemon list:', err);
      },
    });
  }

  private buildGroupsAndMapping(
    data: {
      pokemon: {
        id: string;
        name: string;
        cost?: number;
        setAddons?: string[];
        addons?: TierPokemonAddon[];
      }[];
      team?: { id: string; name: string; coachName: string };
    }[],
  ): void {
    const groupMap = new Map<string, TradeGroup>();
    const pokemonMap = new Map<string, TradePokemon[]>();

    data.forEach((entry) => {
      const teamName = entry.team?.name || 'Free Agency';
      const groupId = entry.team?.id || 'free-agency';

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          name: teamName,
          team: entry.team,
        });
        pokemonMap.set(groupId, []);
      }

      entry.pokemon.forEach((pokemon) => {
        const hasTeraCaptain = (pokemon.setAddons || []).includes(
          'Tera Captain',
        );

        pokemonMap.get(groupId)?.push({
          id: pokemon.id,
          name: pokemon.name,
          cost: pokemon.cost ?? undefined,
          team: entry.team,
          addons: pokemon.addons,
          tera: hasTeraCaptain,
        });
      });
    });

    this.groups.set(Array.from(groupMap.values()));
    this.pokemonByGroup.set(pokemonMap);
  }

  private getSelectedControlValue(
    side: 'side1' | 'side2',
  ): SelectedTradePokemon[] {
    const control = this.tradeForm.get(`${side}Pokemon`);
    const currentValue = control?.value;
    return Array.isArray(currentValue) ? [...currentValue] : [];
  }

  togglePokemon(side: 'side1' | 'side2', pokemonId: string): void {
    const control = this.tradeForm.get(`${side}Pokemon`);
    if (!control) return;

    const currentValue = this.getSelectedControlValue(side);
    const index = currentValue.findIndex((p) => p.id === pokemonId);

    if (index >= 0) {
      currentValue.splice(index, 1);
    } else {
      // default tera value comes from source pokemon in current group
      const groupId = this.tradeForm.get(`${side}Group`)?.value;
      const source = (groupId ? this.pokemonByGroup().get(groupId) : [])?.find(
        (p) => p.id === pokemonId,
      );

      currentValue.push({
        id: pokemonId,
        tera: !!source?.tera,
      });
    }

    control.setValue(currentValue);
  }

  togglePokemonTera(side: 'side1' | 'side2', pokemonId: string): void {
    const control = this.tradeForm.get(`${side}Pokemon`);
    if (!control) return;

    const currentValue = Array.isArray(control.value) ? [...control.value] : [];
    const index = currentValue.findIndex(
      (p: { id: string; tera: boolean }) => p.id === pokemonId,
    );

    if (index < 0) return;

    currentValue[index] = {
      ...currentValue[index],
      tera: !currentValue[index].tera,
    };

    control.setValue(currentValue);
  }

  isPokemonSelected(side: 'side1' | 'side2', pokemonId: string): boolean {
    return this.getSelectedControlValue(side).some((p) => p.id === pokemonId);
  }

  isPokemonTera(side: 'side1' | 'side2', pokemonId: string): boolean {
    // 1) If selected in form, use selected tera value
    const selected = this.getSelectedControlValue(side).find(
      (p) => p.id === pokemonId,
    );
    if (selected) return selected.tera;

    // 2) Otherwise show default tera from source pokemon list (setAddons -> hasTeraCaptain)
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return false;

    const source = (this.pokemonByGroup().get(groupId) || []).find(
      (p) => p.id === pokemonId,
    );
    return source?.tera ?? false;
  }

  private getPokemonForSide(
    side: 'side1' | 'side2',
    pokemonId: string,
  ): TradePokemon | undefined {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return undefined;

    return (this.pokemonByGroup().get(groupId) || []).find(
      (pokemon) => pokemon.id === pokemonId,
    );
  }

  private getTeraAddonCost(pokemon?: TradePokemon): number | undefined {
    if (!pokemon?.addons?.length) return undefined;

    const teraAddon = pokemon.addons.find(
      (addon) =>
        addon.name === 'Tera Captain' || addon.capt?.tera !== undefined,
    );

    return teraAddon?.cost;
  }

  getPokemonCost(side: 'side1' | 'side2', pokemonId: string): number {
    const source = this.getPokemonForSide(side, pokemonId);
    if (!source) return 0;

    if (this.isPokemonTera(side, pokemonId)) {
      return this.getTeraAddonCost(source) ?? source.cost ?? 0;
    }

    return source.cost ?? 0;
  }

  getSelectedTotalCost(side: 'side1' | 'side2'): number {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return 0;

    const selected = this.getSelectedControlValue(side);
    if (!selected.length) return 0;

    const selectedIds = new Set(selected.map((p) => p.id));
    const allPokemon = this.pokemonByGroup().get(groupId) || [];

    return allPokemon
      .filter((pokemon) => selectedIds.has(pokemon.id))
      .reduce(
        (total, pokemon) => total + this.getPokemonCost(side, pokemon.id),
        0,
      );
  }

  getTotalCost(side: 'side1' | 'side2'): number {
    const groupId = this.tradeForm.get(`${side}Group`)?.value;
    if (!groupId) return 0;

    const selectedSet = new Set(
      this.getSelectedControlValue(side).map((p) => p.id),
    );

    const otherSide = side === 'side1' ? 'side2' : 'side1';
    const otherGroupId = this.tradeForm.get(`${otherSide}Group`)?.value;
    if (!otherGroupId) return 0;

    const otherSelectedSet = new Set(
      this.getSelectedControlValue(otherSide).map((p) => p.id),
    );

    const allPokemon = this.pokemonByGroup().get(groupId) || [];
    const otherAllPokemon = this.pokemonByGroup().get(otherGroupId) || [];

    const unselectedCost = allPokemon
      .filter((pokemon) => !selectedSet.has(pokemon.id))
      .reduce(
        (total, pokemon) => total + this.getPokemonCost(side, pokemon.id),
        0,
      );

    const otherSelectedCost = otherAllPokemon
      .filter((pokemon) => otherSelectedSet.has(pokemon.id))
      .reduce(
        (total, pokemon) => total + this.getPokemonCost(otherSide, pokemon.id),
        0,
      );

    return unselectedCost + otherSelectedCost;
  }

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
        pokemon: this.getSelectedControlValue('side1'),
      },
      side2: {
        team:
          side2GroupId && side2GroupId !== 'free-agency'
            ? side2GroupId
            : undefined,
        pokemon: this.getSelectedControlValue('side2'),
      },
      stage: Number(this.tradeForm.get('stage')?.value ?? -1),
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

    if (!side1GroupId || !side2GroupId || side1GroupId === side2GroupId) return;

    const groupLookup = new Map(
      this.groups().map((group) => [group.id, group]),
    );
    const side1Group = groupLookup.get(side1GroupId);
    const side2Group = groupLookup.get(side2GroupId);

    const map = new Map(this.pokemonByGroup());
    const side1List = [...(map.get(side1GroupId) || [])];
    const side2List = [...(map.get(side2GroupId) || [])];

    const side1SelectedMap = new Map(
      tradeData.side1.pokemon.map((pokemon) => [pokemon.id, pokemon.tera]),
    );
    const side2SelectedMap = new Map(
      tradeData.side2.pokemon.map((pokemon) => [pokemon.id, pokemon.tera]),
    );

    const side1Selected: TradePokemon[] = [];
    const side2Selected: TradePokemon[] = [];

    const nextSide1List: TradePokemon[] = [];
    side1List.forEach((pokemon) => {
      if (side1SelectedMap.has(pokemon.id)) {
        side1Selected.push({
          ...pokemon,
          tera: side1SelectedMap.get(pokemon.id) ?? pokemon.tera,
        });
      } else {
        nextSide1List.push(pokemon);
      }
    });

    const nextSide2List: TradePokemon[] = [];
    side2List.forEach((pokemon) => {
      if (side2SelectedMap.has(pokemon.id)) {
        side2Selected.push({
          ...pokemon,
          tera: side2SelectedMap.get(pokemon.id) ?? pokemon.tera,
        });
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

  resetTrade(): void {
    const stage = this.tradeForm.get('stage')?.value || 0;
    this.side1SearchQuery.set('');
    this.side2SearchQuery.set('');
    this.tradeForm.get('stage')?.setValue(stage);
    this.tradeForm.get('side1Pokemon')?.setValue([]);
    this.tradeForm.get('side2Pokemon')?.setValue([]);
  }
}
