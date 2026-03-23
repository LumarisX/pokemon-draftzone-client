import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PokemonFullData } from '../../../services/data.service';
import { SearchField, SearchFilter } from '../pokemon-search.types';

type TableColumnKey =
  | 'name'
  | 'baseSpecies'
  | 'num'
  | 'gen'
  | 'isNonstandard'
  | 'types'
  | 'abilities'
  | 'weaks'
  | 'resists'
  | 'immunities'
  | 'tier'
  | 'natDexTier'
  | 'doublesTier'
  | 'weightkg'
  | 'eggGroups'
  | 'cst'
  | 'nfe'
  | 'evolved'
  | 'isMega'
  | 'isPrimal'
  | 'isGigantamax'
  | 'prevo'
  | 'evos'
  | 'requiredAbility'
  | 'requiredItem'
  | 'requiredMove'
  | 'coverage'
  | 'hp'
  | 'atk'
  | 'def'
  | 'spa'
  | 'spd'
  | 'spe'
  | 'bst'
  | 'tags';

type TableColumnDefinition = {
  key: TableColumnKey;
  label: string;
  defaultVisible: boolean;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

const TABLE_COLUMNS: TableColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'baseSpecies', label: 'Base Species', defaultVisible: false },
  { key: 'num', label: 'Dex #', defaultVisible: true },
  { key: 'gen', label: 'Generation', defaultVisible: false },
  { key: 'isNonstandard', label: 'Nonstandard', defaultVisible: false },
  { key: 'types', label: 'Types', defaultVisible: true },
  { key: 'abilities', label: 'Abilities', defaultVisible: true },
  { key: 'weaks', label: 'Weaknesses', defaultVisible: false },
  { key: 'resists', label: 'Resistances', defaultVisible: false },
  { key: 'immunities', label: 'Immunities', defaultVisible: false },
  { key: 'tier', label: 'Tier', defaultVisible: false },
  { key: 'natDexTier', label: 'NatDex Tier', defaultVisible: false },
  { key: 'doublesTier', label: 'Doubles Tier', defaultVisible: false },
  { key: 'weightkg', label: 'Weight (kg)', defaultVisible: false },
  { key: 'eggGroups', label: 'Egg Groups', defaultVisible: false },
  { key: 'hp', label: 'HP', defaultVisible: true },
  { key: 'atk', label: 'Atk', defaultVisible: true },
  { key: 'def', label: 'Def', defaultVisible: true },
  { key: 'spa', label: 'SpA', defaultVisible: true },
  { key: 'spd', label: 'SpD', defaultVisible: true },
  { key: 'spe', label: 'Spe', defaultVisible: true },
  { key: 'bst', label: 'BST', defaultVisible: true },
  { key: 'cst', label: 'CST', defaultVisible: false },
  { key: 'nfe', label: 'NFE', defaultVisible: false },
  { key: 'evolved', label: 'Evolved', defaultVisible: false },
  { key: 'isMega', label: 'Is Mega', defaultVisible: false },
  { key: 'isPrimal', label: 'Is Primal', defaultVisible: false },
  { key: 'isGigantamax', label: 'Is Gigantamax', defaultVisible: false },
  { key: 'prevo', label: 'Pre-Evolution', defaultVisible: false },
  { key: 'evos', label: 'Evolutions', defaultVisible: false },
  { key: 'requiredAbility', label: 'Required Ability', defaultVisible: false },
  { key: 'requiredItem', label: 'Required Item', defaultVisible: false },
  { key: 'requiredMove', label: 'Required Move', defaultVisible: false },
  { key: 'coverage', label: 'Coverage', defaultVisible: false },
  { key: 'tags', label: 'Tags', defaultVisible: false },
];

const SEARCH_FIELD_TO_COLUMN: Partial<Record<SearchField, TableColumnKey>> = {
  name: 'name',
  baseSpecies: 'baseSpecies',
  num: 'num',
  gen: 'gen',
  isNonstandard: 'isNonstandard',
  types: 'types',
  abilities: 'abilities',
  weaks: 'weaks',
  resists: 'resists',
  immunities: 'immunities',
  tier: 'tier',
  natDexTier: 'natDexTier',
  doublesTier: 'doublesTier',
  weightkg: 'weightkg',
  eggGroups: 'eggGroups',
  cst: 'cst',
  nfe: 'nfe',
  evolved: 'evolved',
  isMega: 'isMega',
  isPrimal: 'isPrimal',
  isGigantamax: 'isGigantamax',
  prevo: 'prevo',
  evos: 'evos',
  requiredAbility: 'requiredAbility',
  requiredItem: 'requiredItem',
  requiredItems: 'requiredItem',
  requiredMove: 'requiredMove',
  coverage: 'coverage',
  hp: 'hp',
  atk: 'atk',
  def: 'def',
  spa: 'spa',
  spd: 'spd',
  spe: 'spe',
  bst: 'bst',
  tags: 'tags',
};

@Component({
  selector: 'pdz-pokemon-search-core',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent {
  @Input() rulesetId?: string;
  @Input() formatId?: string;
  @Input() isLoading = false;
  @Input() errorMessage = '';

  @Input()
  set filterCriteria(value: SearchFilter[] | null) {
    const filters = value ?? [];
    this.activeFilterCount = filters.length;
    this.updateForcedColumns(filters);
  }

  @Input()
  set allResults(value: PokemonFullData[] | null) {
    this._allResults = value ?? [];
    this.page = 1;
    this.applyCurrentPageResults();
  }

  @Input()
  set totalResults(value: number | null | undefined) {
    this._totalResults =
      typeof value === 'number' && Number.isFinite(value)
        ? value
        : this._allResults.length;
    this.applyCurrentPageResults();
  }

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly allColumns = TABLE_COLUMNS;

  activeFilterCount = 0;
  page = 1;
  pageSize = DEFAULT_PAGE_SIZE;
  results: PokemonFullData[] = [];
  forcedVisibleColumns = new Set<TableColumnKey>();
  columnVisibility = this.createInitialColumnVisibility();

  private _allResults: PokemonFullData[] = [];
  private _totalResults = 0;

  get displayTotalResults(): number {
    return this._totalResults || this._allResults.length;
  }

  get isPreviousDisabled(): boolean {
    return this.page <= 1 || this.isLoading;
  }

  get isNextDisabled(): boolean {
    return this.page >= this.totalPages || this.isLoading;
  }

  get totalPages(): number {
    if (!this.displayTotalResults) return 1;
    return Math.ceil(this.displayTotalResults / this.pageSize);
  }

  get visibleColumns(): TableColumnDefinition[] {
    return this.allColumns.filter(
      (column) =>
        this.columnVisibility[column.key] || this.isColumnForced(column.key),
    );
  }

  goToNextPage(): void {
    if (this.page >= this.totalPages || this.isLoading) return;
    this.page += 1;
    this.applyCurrentPageResults();
  }

  goToPreviousPage(): void {
    if (this.page <= 1 || this.isLoading) return;
    this.page -= 1;
    this.applyCurrentPageResults();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.applyCurrentPageResults();
  }

  onColumnVisibilityChange(column: TableColumnKey, value: boolean): void {
    if (this.isColumnForced(column)) {
      this.columnVisibility[column] = true;
      return;
    }

    this.columnVisibility[column] = value;
  }

  showAllColumns(): void {
    for (const column of this.allColumns) {
      this.columnVisibility[column.key] = true;
    }
  }

  isColumnForced(column: TableColumnKey): boolean {
    return this.forcedVisibleColumns.has(column);
  }

  getColumnValue(
    pokemon: PokemonFullData,
    column: TableColumnKey,
  ): string | number {
    switch (column) {
      case 'name':
        return pokemon.name;
      case 'baseSpecies':
        return pokemon.baseSpecies;
      case 'num':
        return pokemon.num;
      case 'gen':
        return pokemon.gen;
      case 'isNonstandard':
        return pokemon.isNonstandard;
      case 'types':
        return pokemon.types.join(' / ');
      case 'abilities':
        return pokemon.abilities.join(', ');
      case 'weaks':
        return pokemon.weaks.join(', ');
      case 'resists':
        return pokemon.resists.join(', ');
      case 'immunities':
        return pokemon.immunities.join(', ');
      case 'tier':
        return pokemon.tier;
      case 'natDexTier':
        return pokemon.natDexTier;
      case 'doublesTier':
        return pokemon.doublesTier;
      case 'weightkg':
        return pokemon.weightkg;
      case 'eggGroups':
        return pokemon.eggGroups.join(', ');
      case 'cst':
        return pokemon.cst;
      case 'nfe':
        return pokemon.nfe ? 'Yes' : 'No';
      case 'evolved':
        return pokemon.evolved ? 'Yes' : 'No';
      case 'isMega':
        return pokemon.isMega ? 'Yes' : 'No';
      case 'isPrimal':
        return pokemon.isPrimal ? 'Yes' : 'No';
      case 'isGigantamax':
        return pokemon.isGigantamax ? 'Yes' : 'No';
      case 'prevo':
        return pokemon.prevo;
      case 'evos':
        return pokemon.evos.join(', ');
      case 'requiredAbility':
        return pokemon.requiredAbility;
      case 'requiredItem':
        return pokemon.requiredItem.join(', ');
      case 'requiredMove':
        return pokemon.requiredMove;
      case 'coverage':
        return pokemon.coverage.join(', ');
      case 'hp':
        return pokemon.hp;
      case 'atk':
        return pokemon.atk;
      case 'def':
        return pokemon.def;
      case 'spa':
        return pokemon.spa;
      case 'spd':
        return pokemon.spd;
      case 'spe':
        return pokemon.spe;
      case 'bst':
        return pokemon.bst;
      case 'tags':
        return pokemon.tags.join(', ');
      default:
        return '';
    }
  }

  private applyCurrentPageResults(): void {
    const clampedPage = Math.min(this.page, this.totalPages);
    this.page = Math.max(clampedPage, 1);

    const offset = (this.page - 1) * this.pageSize;
    this.results = this._allResults.slice(offset, offset + this.pageSize);
  }

  private updateForcedColumns(filters: SearchFilter[]): void {
    const forced = new Set<TableColumnKey>();
    for (const filter of filters) {
      const columnKey = SEARCH_FIELD_TO_COLUMN[filter.field];
      if (!columnKey) continue;
      forced.add(columnKey);
    }

    this.forcedVisibleColumns = forced;
    for (const key of forced) {
      this.columnVisibility[key] = true;
    }
  }

  private createInitialColumnVisibility(): Record<TableColumnKey, boolean> {
    return TABLE_COLUMNS.reduce(
      (accumulator, column) => {
        accumulator[column.key] = column.defaultVisible;
        return accumulator;
      },
      {} as Record<TableColumnKey, boolean>,
    );
  }
}
