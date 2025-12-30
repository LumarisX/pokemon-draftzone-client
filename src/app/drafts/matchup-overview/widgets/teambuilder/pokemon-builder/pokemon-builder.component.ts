import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  getNature,
  Stat,
  STATS,
  StatsTable,
  TeraType,
} from '../../../../../data';
import { IconComponent } from '../../../../../images/icon/icon.component';
import { LoadingComponent } from '../../../../../images/loading/loading.component';
import { SpriteComponent } from '../../../../../images/sprite/sprite.component';
import { TeambuilderService } from '../../../../../services/teambuilder.service';
import {
  getNatureValue,
  isJumpPoint,
  Item,
  Move,
  PokemonBuilder,
  PokemonSetData,
} from './pokemon-builder.model';
import { typeColor } from '../../../../../util/styling';
import { MatchupData, TypeChartPokemon } from '../../../matchup-interface';
import { AnimatedSelectorComponent } from '../animated-selector/animated-selector.component';

export type PokemonBuilderView =
  | 'details'
  | 'moves'
  | 'stats'
  | 'calcs'
  | 'roles';

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
  selector: 'pdz-matchup-pokemon-builder',
  templateUrl: './pokemon-builder.component.html',
  styleUrls: ['./pokemon-builder.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    AnimatedSelectorComponent,
    LoadingComponent,
    SpriteComponent,
    IconComponent,
  ],
})
export class MatchupPokemonBuilderComponent implements OnInit, OnDestroy {
  @Input({ required: true }) pokemon!: PokemonBuilder;
  @Input({ required: true }) matchupData!: MatchupData;
  @Input({ required: true }) team!: PokemonBuilder[];
  @Input() view: PokemonBuilderView = 'details';
  @Output() viewChange = new EventEmitter<PokemonBuilderView>();

  private teambuilderService = inject(TeambuilderService);
  openDropdown: string | null = null;

  STATS = STATS;

  itemSearchQuery = '';
  filteredItems: Item[] = [];

  moveSearchQuery = '';
  filteredMoves: Move[] | null = null;

  selectedMove: number = 0;
  sortColumn: 'type' | 'name' | 'power' | 'accuracy' | 'strength' = 'strength';
  sortDirection: 'desc' = 'desc';

  private docClickHandler = (e: MouseEvent) => this.onDocumentClick(e);

  ngOnInit() {
    document.addEventListener('click', this.docClickHandler);

    this.filteredItems = this.pokemon.items;
    const processedLearnset = this.getProcessedLearnset(this.pokemon);
    this.filteredMoves = processedLearnset ?? null;
    if (this.view === 'moves' && !processedLearnset) {
      this.requestProcessedLearnset(this.pokemon);
    }
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.docClickHandler);
  }

  private onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target?.closest) return;

    // Close dropdown if click is outside dropdown elements
    if (
      !target.closest('.teambuilder__dropdown') &&
      !target.closest('.dropdown-item')
    ) {
      this.openDropdown = null;
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
      if (this.pokemon) {
        this.filteredItems = this.pokemon.items;
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
    if (this.pokemon) {
      this.pokemon.teraType = type;
    }
    this.openDropdown = null;
  }

  selectItem(itemName: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.pokemon) {
      this.pokemon.item = itemName;
    }
    this.itemSearchQuery = '';
    this.openDropdown = null;
  }

  selectAbility(ability: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.pokemon) {
      this.pokemon.ability = ability;
      // Always refresh the cache when ability changes
      this.refreshProcessedLearnset(this.pokemon);
    }
    this.openDropdown = null;
  }

  selectView(viewName: PokemonBuilderView, event?: Event) {
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

  selectMoveView($event?: Event) {
    this.selectView('moves', $event);
    const processedLearnset = this.getProcessedLearnset(this.pokemon);
    if (processedLearnset) {
      this.filteredMoves = processedLearnset;
    } else {
      this.filteredMoves = null;
      this.requestProcessedLearnset(this.pokemon);
    }
  }

  private processedLearnsets = new Map<string, Move[]>();
  private learnsetRequests = new Map<string, boolean>();

  private getCacheKey(pokemon: PokemonBuilder): string {
    return `${pokemon.id}-${pokemon.ability}-${pokemon.item}-${pokemon.teraType}`;
  }

  private requestProcessedLearnset(pokemon: PokemonBuilder): void {
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

          if (this.getCacheKey(this.pokemon) === cacheKey) {
            this.filteredMoves = processedMoves;
          }
        },
        error: (err) => {
          console.error('Error fetching processed learnset:', err);
          this.learnsetRequests.delete(cacheKey);
          // Show error state in UI
          if (this.getCacheKey(this.pokemon) === cacheKey) {
            this.filteredMoves = [];
          }
        },
      });
  }

  private getProcessedLearnset(pokemon: PokemonBuilder): Move[] | undefined {
    return this.processedLearnsets.get(this.getCacheKey(pokemon));
  }

  private refreshProcessedLearnset(pokemon: PokemonBuilder): void {
    this.processedLearnsets.delete(this.getCacheKey(pokemon));
    this.learnsetRequests.delete(this.getCacheKey(pokemon));
    this.requestProcessedLearnset(pokemon);
  }

  getStep() {
    return 4;
  }

  hpRating(hp: number): number {
    let starCount = 0;
    if (hp % this.matchupData.details.level === 1) starCount++;
    if (hp % 16 === 1) starCount++;
    if (hp % 4 === 1) starCount++;
    if (hp % 2 === 1) starCount++;
    return starCount;
  }

  setNature(stat: keyof StatsTable, natureType: 'positive' | 'negative') {
    if (natureType === 'positive') {
      this.pokemon.nature = getNature(stat, this.pokemon.nature.drop);
    } else {
      this.pokemon.nature = getNature(this.pokemon.nature.boost, stat);
    }
  }

  // Overload for when called from new ability selector (no event)
  selectAbilityFromSelector(ability: string) {
    this.selectAbility(ability);
  }

  fetchMoveCalculations(move: Move, pokemon: PokemonSetData): void {
    const oppTeam = this.matchupData.summary[1].team;

    for (let oppPokemon of oppTeam) {
      const params: {
        attacker: PokemonSetData;
        target: PokemonSetData;
        move: Move;
      } = {
        move,
        attacker: pokemon,
        target: { id: oppPokemon.id, name: oppPokemon.name },
      };

      this.teambuilderService.getMoveCalculations(params).subscribe({
        next: (response) => {
          console.log('Move calculations:', response);
        },
        error: (err) => {
          console.error('Error fetching move calculations:', err);
        },
      });
    }
  }

  selectMove(moveSlot: number, move: Move | null, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.pokemon) {
      const foundMove = this.pokemon.moves.findIndex(
        (m) => m && m?.id === move?.id,
      );
      if (foundMove >= 0) {
        this.selectedMove = foundMove;
        this.pokemon.moves[foundMove] = null;
      } else {
        this.pokemon.moves[moveSlot] = move;
        const pokemon = this.pokemon;
        const processedLearnset = this.getProcessedLearnset(pokemon);
        this.filteredMoves = processedLearnset
          ? this.sortMoves(processedLearnset)
          : null;
        if (move) {
          this.findEmptyMoveSlot();
          this.fetchMoveCalculations(move, pokemon); // Trigger WebSocket request
        }
      }
    }
    this.moveSearchQuery = '';
  }

  findEmptyMoveSlot() {
    const emptySlot = this.pokemon.moves.findIndex((m) => m === null);
    if (emptySlot >= 0) {
      this.selectedMove = emptySlot;
    }
  }

  toggleItemDropdown(event?: MouseEvent) {
    this.toggleDropdown('item', event);
  }

  filterItems() {
    if (!this.pokemon) return;
    const query = this.itemSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredItems = this.pokemon.items;
    } else {
      this.filteredItems = this.pokemon.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
  }

  filterMoves() {
    if (!this.pokemon) return;
    const pokemon = this.pokemon;
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
    if (!this.pokemon?.item) {
      return null;
    }
    return this.pokemon.items.find((item) => item.name === this.pokemon.item);
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
    return this.pokemon.moves.some((m) => m?.id === move?.id);
  }

  getCoverageEffectiveness(pokemon: TypeChartPokemon) {
    const coverage = this.pokemon.moves
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
    const pokemon = this.pokemon;
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

  setSpeedTier(pokemon: PokemonBuilder, targetSpeed: number) {
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

  getGenderOptions(pokemon: PokemonBuilder) {
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

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Could not copy text: ', err);
    });
  }
}
