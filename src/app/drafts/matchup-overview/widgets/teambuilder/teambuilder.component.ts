import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getNature, Stat, STATS, StatsTable, TeraType } from '../../../../data';
import { LoadingComponent } from '../../../../images/loading/loading.component';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import {
  getNatureValue,
  isJumpPoint,
  Move,
  PokemonSet,
} from '../../../../tools/teambuilder/pokemon-builder.model';
import { typeColor } from '../../../../util/styling';
import { MatchupData, TypeChartPokemon } from '../../matchup-interface';
import { AnimatedSelectorComponent } from './animated-selector/animated-selector.component';

type SpeedTier = {
  pokemon: {
    name: string;
    id: string;
    shiny?: boolean | undefined;
  };
  speed: number;
  modifiers: string[];
  team: string;
};

@Component({
  selector: 'pdz-teambuilder-widget',
  templateUrl: './teambuilder.component.html',
  styleUrls: ['./teambuilder.component.scss', '../../matchup.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    LoadingComponent,
    AnimatedSelectorComponent,
  ],
})
export class TeambuilderWidgetComponent {
  @Input({ required: true }) matchupId!: string;
  @Input({ required: true }) matchupData!: MatchupData;

  private teambuilderService = inject(TeambuilderService);

  @Input({ required: true }) team!: PokemonSet[];
  tab: number | null = 0;

  view: 'details' | 'moves' | 'stats' | 'calcs' | 'roles' = 'details';

  STATS = STATS;

  openDropdown: string | null = null;

  itemSearchQuery = '';
  filteredItems: (typeof this.team)[0]['items'] = [];

  moveSearchQuery = '';
  filteredMoves: Move[] | null = null;

  selectedMove: number = 0;
  sortColumn: 'type' | 'name' | 'power' | 'accuracy' | 'strength' = 'strength';
  sortDirection: 'desc' = 'desc';

  private _docClickHandler = (e: MouseEvent) => this._onDocumentClick(e);

  ngOnInit() {
    document.addEventListener('click', this._docClickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this._docClickHandler);
    this.processedLearnsets.clear();
    this.learnsetRequests.clear();
  }

  addPokemonToTeamAndSelect(pokemon: Pokemon) {
    const teamIndex = this.team.length;
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        const pokemonSet = PokemonSet.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
        this.tab = teamIndex;
        this.filteredItems = this.team[teamIndex].items;
        this.filteredMoves = null;

        // Request processed learnset if moves view is active
        if (this.view === 'moves') {
          this.requestProcessedLearnset(pokemonSet);
        }
      });
  }

  isPokemonInTeam(pokemon: Pokemon): boolean {
    return this.team.some((teamMon) => teamMon.id === pokemon.id);
  }

  getStep() {
    return 4;
  }

  hpRating(hp: number): string {
    let stars = '';
    if (hp % this.matchupData.details.level === 1) stars += '*';
    if (hp % 16 === 1) stars += '*';
    if (hp % 4 === 1) stars += '*';
    if (hp % 2 === 1) stars += '*';
    return stars;
  }

  setNature(stat: keyof StatsTable, natureType: 'positive' | 'negative') {
    if (this.tab == null || !this.team[this.tab]) return;
    if (natureType === 'positive') {
      this.team[this.tab].nature = getNature(
        stat,
        this.team[this.tab].nature.drop,
      );
    } else {
      this.team[this.tab].nature = getNature(
        this.team[this.tab].nature.boost,
        stat,
      );
    }
  }

  toggleDropdown(type: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }

    this.openDropdown = this.openDropdown === type ? null : type;

    // Special handling for items dropdown
    if (type === 'item' && this.openDropdown === 'item') {
      this.itemSearchQuery = '';
      if (this.tab != null && this.team[this.tab]) {
        this.filteredItems = this.team[this.tab].items;
      }
      setTimeout(() => {
        const searchInput = document.querySelector(
          '.dropdown-search',
        ) as HTMLInputElement;
        searchInput?.focus();
      }, 0);
    }
  }

  selectTeraType(type: TeraType, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.tab != null && this.team[this.tab]) {
      this.team[this.tab].teraType = type;
    }
    this.openDropdown = null;
  }

  selectItem(itemName: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.tab != null && this.team[this.tab]) {
      this.team[this.tab].item = itemName;
    }
    this.itemSearchQuery = '';
    this.openDropdown = null;
  }

  selectAbility(ability: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.tab != null && this.team[this.tab]) {
      this.team[this.tab].ability = ability;
      // Always refresh the cache when ability changes
      this.refreshProcessedLearnset(this.team[this.tab]);
    }
    this.openDropdown = null;
  }

  // Overload for when called from new ability selector (no event)
  selectAbilityFromSelector(ability: string) {
    this.selectAbility(ability);
  }

  selectMove(moveSlot: number, move: Move | null, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.tab != null && this.team[this.tab]) {
      const foundMove = this.team[this.tab].moves.findIndex(
        (m) => m && m?.id === move?.id,
      );
      if (foundMove >= 0) {
        this.selectedMove = foundMove;
        this.team[this.tab].moves[foundMove] = null;
      } else {
        this.team[this.tab].moves[moveSlot] = move;
        const pokemon = this.team[this.tab];
        const processedLearnset = this.getProcessedLearnset(pokemon);
        this.filteredMoves = processedLearnset
          ? this.sortMoves(processedLearnset)
          : null;
        if (move) {
          this.findEmptyMoveSlot();
        }
      }
    }
    this.moveSearchQuery = '';
  }

  findEmptyMoveSlot() {
    if (this.tab == null || !this.team[this.tab]) return;
    const emptySlot = this.team[this.tab].moves.findIndex((m) => m === null);
    if (emptySlot >= 0) {
      this.selectedMove = emptySlot;
    }
  }

  toggleItemDropdown(event?: MouseEvent) {
    this.toggleDropdown('item', event);
  }

  selectTab(index: number | null, event?: Event) {
    if (event) {
      if (
        typeof (event as KeyboardEvent).key === 'string' &&
        event instanceof KeyboardEvent
      ) {
        event.preventDefault();
      }
      event.stopPropagation();
    }
    if (index === null) {
      this.tab = null;
      return;
    }
    if (typeof index === 'number' && this.team[index]) {
      const pokemon = this.team[index];
      const processedLearnset = this.getProcessedLearnset(pokemon);
      this.filteredMoves = processedLearnset ?? null;
      this.tab = index;
      if (this.view === 'moves' && !processedLearnset) {
        this.requestProcessedLearnset(pokemon);
      }
    } else if (this.team.length > 0) {
      this.tab = 0;
    } else {
      this.tab = null;
    }
  }

  selectMoveView($event?: Event) {
    this.selectView('moves', $event);
    if (this.tab !== null && this.team[this.tab]) {
      const pokemon = this.team[this.tab];
      const processedLearnset = this.getProcessedLearnset(pokemon);

      if (processedLearnset) {
        this.filteredMoves = processedLearnset;
      } else {
        this.filteredMoves = null;
        this.requestProcessedLearnset(pokemon);
      }
    }
  }

  selectView(viewName: typeof this.view, event?: Event) {
    if (event) {
      if (
        typeof (event as KeyboardEvent).key === 'string' &&
        event instanceof KeyboardEvent
      ) {
        event.preventDefault();
      }
      event.stopPropagation();
    }

    this.view = viewName;
  }

  filterItems() {
    if (this.tab == null || !this.team[this.tab]) return;
    const query = this.itemSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredItems = this.team[this.tab].items;
    } else {
      this.filteredItems = this.team[this.tab].items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
  }

  filterMoves() {
    if (this.tab == null || !this.team[this.tab]) return;
    const pokemon = this.team[this.tab];
    const learnset = this.getProcessedLearnset(pokemon);

    if (!learnset) {
      this.filteredMoves = null;
      return;
    }

    const removeSpecialChars = (str: string) => str.replace(/[^a-z0-9]/gi, '');

    const query = this.moveSearchQuery.toLowerCase().trim().split(' ');
    let filtered: Move[];
    if (
      !query ||
      query.length === 0 ||
      (query.length === 1 && query[0] === '')
    ) {
      filtered = learnset;
    } else {
      filtered = query.reduce<Move[]>((filtered, term) => {
        const isInverse = term.startsWith('!');
        const searchTerm = removeSpecialChars(isInverse ? term.slice(1) : term);

        if (!searchTerm) return filtered;

        return filtered.filter((move) => {
          const matches =
            removeSpecialChars(move.name.toLowerCase()).includes(searchTerm) ||
            move.tags.some((tag) =>
              removeSpecialChars(tag.toLowerCase()).includes(searchTerm),
            ) ||
            removeSpecialChars(move.type.toLowerCase()).includes(searchTerm) ||
            removeSpecialChars(move.category.toLowerCase()).includes(
              searchTerm,
            );

          return isInverse ? !matches : matches;
        });
      }, learnset);
    }

    this.filteredMoves = this.sortMoves(filtered);
  }

  getItemIcon(pngId: string) {
    if (!pngId) return '';
    return pngId;
  }

  getSelectedItem() {
    if (this.tab == null || !this.team[this.tab] || !this.team[this.tab].item) {
      return null;
    }
    const currentPokemon = this.team[this.tab];
    return currentPokemon.items.find(
      (item) => item.name === currentPokemon.item,
    );
  }

  getTeraIcon(type: string) {
    if (!type) return '';
    const cap = this.capitalize(type);
    return `assets/icons/tera_types/Tera${cap}.png`;
  }

  private capitalize(s: string) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private _onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest || !target.closest('.dropdown-tera')) {
      this.openDropdown = null;
    }
    if (!target.closest || !target.closest('.dropdown-item')) {
      this.openDropdown = null;
    }
  }

  statColor(statValue: number | undefined): string | undefined {
    if (statValue === undefined) return undefined;
    const diff = statValue - 80;
    if (Math.abs(diff) <= 7) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level = Math.min(Math.floor((Math.abs(diff) - 8) / 15) + 1, 5);
    return `var(--pdz-color-scale-${sign}-${level})`;
  }

  typeColor = typeColor;

  isMoveSelected(move: Move | null): boolean {
    if (this.tab == null || !this.team[this.tab]) return false;
    return this.team[this.tab].moves.some((m) => m?.id === move?.id);
  }

  getCoverageEffectiveness(pokemon: TypeChartPokemon) {
    if (this.tab == null || !this.team[this.tab]) return 1;
    const coverage = this.team[this.tab].moves
      .filter((move) => move?.category !== 'Status')
      .reduce(
        (acc, curr) =>
          Math.max(
            acc,
            curr?.type === 'Stellar'
              ? 1
              : curr
                ? pokemon.weak[0][curr.type]
                : acc,
          ),
        0,
      );
    if (coverage > 2) return 'var(--pdz-color-scale-positive-5)';
    if (coverage > 1) return 'var(--pdz-color-scale-positive-3)';
    if (coverage < 0.5) return 'var(--pdz-color-scale-negative-5)';
    if (coverage < 1) return 'var(--pdz-color-scale-negative-3)';
    return 'var(--pdz-color-scale-neutral)';
  }

  getSliderColor(stat: Stat): string | undefined {
    if (this.tab == null || !this.team[this.tab]) return undefined;
    const pokemon = this.team[this.tab];
    if (pokemon.stats[stat].get() > pokemon.stats[stat].mid()) {
      if (!pokemon.hasLegalEvs()) {
        return 'var(--pdz-color-warning)';
      } else if (
        isJumpPoint(
          pokemon.stats[stat].get() - 1,
          getNatureValue(stat, pokemon.nature),
        )
      ) {
        return 'var(--pdz-color-scale-positive-5)';
      } else {
        return 'var(--pdz-color-scale-positive)';
      }
    } else if (pokemon.stats[stat].get() < pokemon.stats[stat].mid()) {
      return 'var(--pdz-color-scale-negative)';
    }
    return undefined;
  }

  private processedLearnsets = new Map<string, Move[]>();
  private learnsetRequests = new Map<string, boolean>();

  private getCacheKey(pokemon: PokemonSet): string {
    return `${pokemon.id}-${pokemon.ability}-${pokemon.item}-${pokemon.teraType}`;
  }

  private getCurrentPokemon(): PokemonSet | null {
    return this.tab !== null ? (this.team[this.tab] ?? null) : null;
  }

  private requestProcessedLearnset(pokemon: PokemonSet): void {
    const cacheKey = this.getCacheKey(pokemon);

    if (
      this.processedLearnsets.has(cacheKey) ||
      this.learnsetRequests.get(cacheKey)
    ) {
      return;
    }

    this.learnsetRequests.set(cacheKey, true);

    this.teambuilderService
      .getPokemonLearnset(pokemon, this.matchupData.details.ruleset)
      .subscribe({
        next: (moves) => {
          const processedMoves: Move[] = moves.map((move) => ({
            ...move,
            accuracy: move.accuracy === true ? '-' : move.accuracy,
          }));
          this.processedLearnsets.set(cacheKey, processedMoves);
          this.learnsetRequests.delete(cacheKey);

          const currentPokemon = this.getCurrentPokemon();
          if (currentPokemon && this.getCacheKey(currentPokemon) === cacheKey) {
            this.filteredMoves = processedMoves;
          }
        },
        error: (err) => {
          console.error('Error fetching processed learnset:', err);
          this.learnsetRequests.delete(cacheKey);
          // Show error state in UI
          const currentPokemon = this.getCurrentPokemon();
          if (currentPokemon && this.getCacheKey(currentPokemon) === cacheKey) {
            this.filteredMoves = [];
          }
        },
      });
  }

  private getProcessedLearnset(pokemon: PokemonSet): Move[] | undefined {
    return this.processedLearnsets.get(this.getCacheKey(pokemon));
  }

  private refreshProcessedLearnset(pokemon: PokemonSet): void {
    this.processedLearnsets.delete(this.getCacheKey(pokemon));
    this.learnsetRequests.delete(this.getCacheKey(pokemon));
    this.requestProcessedLearnset(pokemon);
  }

  categoryIcon(category: string): string {
    return `/assets/icons/moves/move-${category.toLowerCase()}.png`;
  }

  sortByColumn(column: 'type' | 'name' | 'power' | 'accuracy' | 'strength') {
    this.sortColumn = column;
    this.filterMoves();
  }

  private sortMoves(moves: Move[]): Move[] {
    return [...moves].sort((a, b) => {
      let comparison = 0;

      switch (this.sortColumn) {
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'power':
          const aPower = typeof a.basePower === 'number' ? a.basePower : 0;
          const bPower = typeof b.basePower === 'number' ? b.basePower : 0;
          comparison = bPower - aPower;
          break;
        case 'accuracy':
          const aAcc =
            typeof a.accuracy === 'number'
              ? a.accuracy
              : a.accuracy === '-'
                ? 100
                : 0;
          const bAcc =
            typeof b.accuracy === 'number'
              ? b.accuracy
              : b.accuracy === '-'
                ? 100
                : 0;
          comparison = bAcc - aAcc;
          break;
        case 'strength':
          comparison = (b.strength || 0) - (a.strength || 0);
          break;
      }

      return comparison;
    });
  }

  // Drag and drop state
  draggedTier: SpeedTier | null = null;
  dragOverTier: SpeedTier | null = null;
  speedTiers: {
    pokemon: { name: string; id: string; shiny?: boolean };
    speed: number;
    modifiers: string[];
    team: string;
  }[] = [];

  getSpeedTiers(): SpeedTier[] {
    const tiers: {
      pokemon: { name: string; id: string; shiny?: boolean };
      speed: number;
      modifiers: string[];
      team: string;
    }[] = [];

    const team = this.matchupData.speedchart.teams[1];
    for (let pokemon of team) {
      tiers.push(
        ...pokemon.tiers
          .filter((tier) => {
            if (tier.modifiers.length > 1) return false;
            return true;
          })
          .map((tier) => ({
            pokemon: {
              name: pokemon.name,
              id: pokemon.id,
              shiny: pokemon.shiny,
            },
            speed: tier.speed,
            team: '1',
            modifiers: tier.modifiers,
          })),
      );
    }

    for (let pokemon of this.team) {
      let statModifier: string = pokemon.stats.spe.evs.toString();
      if (pokemon.nature.boost === 'spe' && pokemon.nature.drop !== 'spe')
        statModifier += '+';
      else if (pokemon.nature.drop === 'spe' && pokemon.nature.boost !== 'spe')
        statModifier += '-';
      if (pokemon.stats.spe.ivs < 31)
        statModifier += ` ${pokemon.stats.spe.ivs}ivs`;
      tiers.push({
        pokemon: {
          name: pokemon.nickname || pokemon.name,
          id: pokemon.id,
        },
        speed: pokemon.stats.spe.get(),
        team: '0',
        modifiers: [statModifier],
      });
    }

    // Sort by speed descending
    this.speedTiers = tiers.sort((a, b) => b.speed - a.speed);
    return this.speedTiers;
  }

  onDragStart(tier: SpeedTier, event: DragEvent) {
    if (tier.team !== '0') {
      event.preventDefault();
      return;
    }
    this.draggedTier = tier;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(tier: SpeedTier, event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.draggedTier === null) return;

    // Only update if we're actually over a different tier
    if (
      !this.dragOverTier ||
      this.dragOverTier.pokemon.id !== tier.pokemon.id ||
      this.dragOverTier.speed !== tier.speed
    ) {
      this.dragOverTier = tier;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragLeave(event: DragEvent) {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const related = event.relatedTarget as HTMLElement;

    // Only clear if we're actually leaving the speedtier container
    const speedtierElement = target.closest('.speedtier-wrapper');
    const relatedSpeedtier = related?.closest('.speedtier-wrapper');

    if (speedtierElement && speedtierElement !== relatedSpeedtier) {
      this.dragOverTier = null;
    }
  }

  onDrop(tier: SpeedTier, event: DragEvent) {
    event.preventDefault();
    if (this.draggedTier === null || this.draggedTier === tier) {
      this.draggedTier = null;
      this.dragOverTier = null;
      return;
    }
    const targetSpeed = tier.speed + 1;
    const pokemonSet = this.team.find(
      (mon) => mon.id === this.draggedTier?.pokemon.id,
    );
    if (pokemonSet) this.setSpeedTier(pokemonSet, targetSpeed);
    this.draggedTier = null;
    this.dragOverTier = null;
  }

  onDragEnd() {
    this.draggedTier = null;
    this.dragOverTier = null;
  }

  setSpeedTier(pokemon: PokemonSet, targetSpeed: number) {
    const max = pokemon.stats.spe.max();
    if (pokemon.stats.spe.get() === max && targetSpeed > max) {
      pokemon.nature = getNature('spe', pokemon.nature.drop);
    } else if (targetSpeed < pokemon.stats.spe.mid()) {
      const boost = pokemon.nature.drop === 'atk' ? 'spa' : 'atk';
      pokemon.nature = getNature(boost, pokemon.nature.drop);
    }
    pokemon.stats.spe.set(targetSpeed);
  }

  shouldShowPlaceholder(tier: SpeedTier): boolean {
    if (this.draggedTier === null || this.dragOverTier === null) return false;

    return (
      this.dragOverTier.pokemon.id === tier.pokemon.id &&
      this.dragOverTier.speed === tier.speed &&
      this.draggedTier.pokemon.id !== tier.pokemon.id
    );
  }

  isDragging(tier: SpeedTier): boolean {
    if (this.draggedTier === null) return false;
    return (
      this.draggedTier.pokemon.id === tier.pokemon.id &&
      this.draggedTier.speed === tier.speed
    );
  }

  getGenderOptions(pokemon: PokemonSet) {
    const genderOptions = {
      M: { value: 'M', label: '', icon: 'male' },
      F: { value: 'F', label: '', icon: 'female' },
      rand: { value: null, label: '', icon: 'help' },
    };
    if (pokemon.genders.length > 1) {
      return [genderOptions.M, genderOptions.rand, genderOptions.F];
    } else if (pokemon.genders.length === 0) {
      return [genderOptions.rand];
    } else {
      return [genderOptions[pokemon.genders[0]]];
    }
  }
}
