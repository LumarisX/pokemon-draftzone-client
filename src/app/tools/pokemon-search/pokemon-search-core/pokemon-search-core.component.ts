import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DataService, ResultData } from '../../../services/data.service';

type Primitive = string | number | boolean;

export type SearchOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'notContains'
  | 'in'
  | 'nin';

export type SearchLogicalMode = 'and' | 'or';

type SearchFieldType = 'string' | 'number' | 'boolean';

export type MoveField =
  | 'id'
  | 'name'
  | 'type'
  | 'category'
  | 'basePower'
  | 'accuracy'
  | 'pp'
  | 'priority'
  | 'target';

export type SearchField =
  | 'id'
  | 'name'
  | 'fullname'
  | 'baseSpecies'
  | 'num'
  | 'gen'
  | 'tier'
  | 'natDexTier'
  | 'doublesTier'
  | 'isNonstandard'
  | 'types'
  | 'abilities'
  | 'eggGroups'
  | 'weaks'
  | 'resists'
  | 'immunities'
  | 'tags'
  | 'weightkg'
  | 'bst'
  | 'cst'
  | 'hp'
  | 'atk'
  | 'def'
  | 'spa'
  | 'spd'
  | 'spe'
  | 'nfe'
  | 'evolved'
  | 'isMega'
  | 'isPrimal'
  | 'isGigantamax'
  | 'prevo'
  | 'evos'
  | 'requiredAbility'
  | 'requiredItem'
  | 'requiredItems'
  | 'requiredMove'
  | 'learns'
  | 'coverage';

export type MoveFilter = {
  field: MoveField;
  operator: SearchOperator;
  value: Primitive;
};

export type SearchFilter = {
  field: SearchField;
  operator: SearchOperator;
  value?: Primitive;
  moveMode?: SearchLogicalMode;
  moveFilters?: MoveFilter[];
};

export type SearchPokemonRequest = {
  mode: SearchLogicalMode;
  searches: SearchFilter[];
  sortBy: SearchField;
  sortDirection: 'asc' | 'desc';
  limit: number;
  offset: number;
};

type FieldDefinition = {
  key: SearchField;
  label: string;
  type: SearchFieldType;
  operators: SearchOperator[];
};

type MoveFieldDefinition = {
  key: MoveField;
  label: string;
  type: SearchFieldType;
  operators: SearchOperator[];
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const STRING_OPERATORS: SearchOperator[] = [
  'eq',
  'ne',
  'contains',
  'notContains',
  'in',
  'nin',
];
const NUMBER_OPERATORS: SearchOperator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
];
const BOOLEAN_OPERATORS: SearchOperator[] = ['eq', 'ne'];

const FIELD_DEFINITIONS: FieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'string', operators: STRING_OPERATORS },
  { key: 'id', label: 'ID', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'fullname',
    label: 'Full Name',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'baseSpecies',
    label: 'Base Species',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'num',
    label: 'Dex Number',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'gen',
    label: 'Generation',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'tier', label: 'Tier', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'natDexTier',
    label: 'NatDex Tier',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'doublesTier',
    label: 'Doubles Tier',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'isNonstandard',
    label: 'Nonstandard',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  { key: 'types', label: 'Types', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'abilities',
    label: 'Abilities',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'eggGroups',
    label: 'Egg Groups',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'weaks',
    label: 'Weaknesses',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'resists',
    label: 'Resistances',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'immunities',
    label: 'Immunities',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  { key: 'tags', label: 'Tags', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'weightkg',
    label: 'Weight (kg)',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'bst', label: 'BST', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'cst', label: 'CST', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'hp', label: 'HP', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'atk', label: 'Attack', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'def', label: 'Defense', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'spa',
    label: 'Special Attack',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'spd',
    label: 'Special Defense',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'spe', label: 'Speed', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'nfe',
    label: 'Not Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'evolved',
    label: 'Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isMega',
    label: 'Is Mega',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isPrimal',
    label: 'Is Primal',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isGigantamax',
    label: 'Is Gigantamax',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'prevo',
    label: 'Pre-evolution',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'evos',
    label: 'Evolutions',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredAbility',
    label: 'Required Ability',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredItem',
    label: 'Required Item',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredItems',
    label: 'Required Items',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredMove',
    label: 'Required Move',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'learns',
    label: 'Learnset (with move filters)',
    type: 'string',
    operators: ['contains'],
  },
  {
    key: 'coverage',
    label: 'Coverage',
    type: 'string',
    operators: STRING_OPERATORS,
  },
];

const MOVE_FIELD_DEFINITIONS: MoveFieldDefinition[] = [
  {
    key: 'name',
    label: 'Move Name',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  { key: 'id', label: 'Move ID', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'type',
    label: 'Move Type',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'category',
    label: 'Category',
    type: 'string',
    operators: ['eq', 'ne', 'in', 'nin'],
  },
  {
    key: 'basePower',
    label: 'Base Power',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'pp', label: 'PP', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'priority',
    label: 'Priority',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'target',
    label: 'Target',
    type: 'string',
    operators: STRING_OPERATORS,
  },
];

const DEFAULT_PAGE_SIZE = 50;

@Component({
  selector: 'pdz-pokemon-search-core',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent {
  private dataService = inject(DataService);

  @Input() rulesetId?: string;
  @Input() formatId?: string;

  @Input()
  set startQuery(value: string | SearchPokemonRequest | null) {
    if (!value) return;

    const parsed = this.parseIncomingQuery(value);
    if (!parsed) return;

    const parsedSignature = JSON.stringify(parsed);
    if (parsedSignature === this.lastAppliedQuerySignature) return;

    this.lastAppliedQuerySignature = parsedSignature;
    this.applyRequest(parsed);
    this.search(false);
  }

  @Output() updatedQuery = new EventEmitter<SearchPokemonRequest>();

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly fields = FIELD_DEFINITIONS;
  readonly moveFields = MOVE_FIELD_DEFINITIONS;
  readonly operatorLabels: Record<SearchOperator, string> = {
    eq: '=',
    ne: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    contains: 'contains',
    notContains: 'not contains',
    in: 'in',
    nin: 'not in',
  };

  quickName = '';
  mode: SearchLogicalMode = 'or';
  sortBy: SearchField = 'num';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = DEFAULT_PAGE_SIZE;
  filters: SearchFilter[] = [this.createDefaultFilter()];
  results: ResultData[] = [];
  isLoading = false;
  errorMessage = '';
  canGoNextPage = false;

  private lastAppliedQuerySignature = '';

  quickSearch(): void {
    const value = this.quickName.trim();
    if (!value) {
      this.errorMessage = 'Enter a Pokemon name to run quick search.';
      return;
    }

    this.mode = 'or';
    this.filters = [
      { field: 'name', operator: 'contains', value },
      { field: 'types', operator: 'contains', value },
      { field: 'abilities', operator: 'contains', value },
      {
        field: 'learns',
        operator: 'contains',
        moveMode: 'and',
        moveFilters: [{ field: 'name', operator: 'contains', value }],
      },
    ];

    this.page = 1;

    this.search(false);
  }

  search(resetToFirstPage = true): void {
    if (resetToFirstPage) {
      this.page = 1;
    }

    const searches = this.getSanitizedFilters();
    if (!searches.length) {
      this.errorMessage = 'Add at least one valid filter before searching.';
      this.results = [];
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const query: SearchPokemonRequest = {
      mode: this.mode,
      searches,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      limit: this.pageSize,
      offset: (this.page - 1) * this.pageSize,
    };

    this.updatedQuery.emit(query);

    this.dataService
      .pokemonSearch(query, this.rulesetId, this.formatId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (results) => {
          this.results = results;
          this.canGoNextPage = results.length === this.pageSize;
        },
        error: (error) => {
          this.results = [];
          this.canGoNextPage = false;
          this.errorMessage = error?.error?.message || 'Search request failed.';
        },
      });
  }

  addFilter(): void {
    this.filters = [...this.filters, this.createDefaultFilter()];
  }

  removeFilter(index: number): void {
    this.filters.splice(index, 1);
    if (!this.filters.length) {
      this.filters.push(this.createDefaultFilter());
    }
  }

  onFilterFieldChange(filter: SearchFilter): void {
    const definition = this.getFieldDefinition(filter.field);
    filter.operator = definition.operators[0];
    if (filter.field === 'learns') {
      filter.moveMode = filter.moveMode ?? 'and';
      filter.moveFilters = filter.moveFilters?.length
        ? filter.moveFilters
        : [this.createDefaultMoveFilter()];
      delete filter.value;
      return;
    }

    delete filter.moveMode;
    delete filter.moveFilters;
    filter.value = this.getDefaultValueByType(definition.type);
  }

  addMoveFilter(filter: SearchFilter): void {
    if (filter.field !== 'learns') return;
    filter.moveFilters = filter.moveFilters ?? [];
    filter.moveFilters.push(this.createDefaultMoveFilter());
  }

  removeMoveFilter(filter: SearchFilter, index: number): void {
    if (filter.field !== 'learns' || !filter.moveFilters) return;
    filter.moveFilters.splice(index, 1);
    if (!filter.moveFilters.length) {
      filter.moveFilters.push(this.createDefaultMoveFilter());
    }
  }

  onMoveFieldChange(moveFilter: MoveFilter): void {
    const definition = this.getMoveFieldDefinition(moveFilter.field);
    moveFilter.operator = definition.operators[0];
    moveFilter.value = this.getDefaultValueByType(definition.type);
  }

  resetFilters(): void {
    this.mode = 'or';
    this.sortBy = 'num';
    this.sortDirection = 'asc';
    this.page = 1;
    this.pageSize = DEFAULT_PAGE_SIZE;
    this.filters = [this.createDefaultFilter()];
    this.results = [];
    this.errorMessage = '';
    this.canGoNextPage = false;
  }

  goToNextPage(): void {
    if (!this.canGoNextPage || this.isLoading) return;
    this.page += 1;
    this.search(false);
  }

  goToPreviousPage(): void {
    if (this.page <= 1 || this.isLoading) return;
    this.page -= 1;
    this.search(false);
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.search(false);
  }

  fieldOperators(field: SearchField): SearchOperator[] {
    return this.getFieldDefinition(field).operators;
  }

  moveFieldOperators(field: MoveField): SearchOperator[] {
    return this.getMoveFieldDefinition(field).operators;
  }

  get isPreviousDisabled(): boolean {
    return this.page <= 1 || this.isLoading;
  }

  get isNextDisabled(): boolean {
    return !this.canGoNextPage || this.isLoading;
  }

  private getSanitizedFilters(): SearchFilter[] {
    const output: SearchFilter[] = [];

    for (const filter of this.filters) {
      if (filter.field === 'learns') {
        const moveFilters = (filter.moveFilters ?? []).filter((moveFilter) =>
          this.hasPrimitiveValue(moveFilter.value),
        );
        if (!moveFilters.length) continue;

        output.push({
          field: 'learns',
          operator: 'contains',
          moveMode: filter.moveMode ?? 'and',
          moveFilters,
        });
        continue;
      }

      if (!this.hasPrimitiveValue(filter.value)) continue;

      output.push({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      });
    }

    return output;
  }

  private hasPrimitiveValue(value: Primitive | undefined): value is Primitive {
    if (typeof value === 'boolean' || typeof value === 'number') return true;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  }

  private parseIncomingQuery(
    value: string | SearchPokemonRequest,
  ): SearchPokemonRequest | null {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed) as SearchPokemonRequest;
    } catch {
      try {
        return JSON.parse(decodeURIComponent(trimmed)) as SearchPokemonRequest;
      } catch {
        return null;
      }
    }
  }

  private applyRequest(request: SearchPokemonRequest): void {
    this.mode = request.mode === 'or' ? 'or' : 'and';
    this.sortBy = this.getFieldDefinition(request.sortBy).key;
    this.sortDirection = request.sortDirection === 'desc' ? 'desc' : 'asc';
    this.pageSize =
      request.limit && request.limit > 0 ? request.limit : DEFAULT_PAGE_SIZE;
    this.page = Math.floor((request.offset ?? 0) / this.pageSize) + 1;

    const nextFilters = request.searches
      .map((search) => this.normalizeFilter(search))
      .filter((search): search is SearchFilter => Boolean(search));

    this.filters = nextFilters.length
      ? nextFilters
      : [this.createDefaultFilter()];
  }

  private normalizeFilter(search: SearchFilter): SearchFilter | null {
    const fieldDefinition = this.getFieldDefinition(search.field);
    const operator = fieldDefinition.operators.includes(search.operator)
      ? search.operator
      : fieldDefinition.operators[0];

    if (search.field === 'learns') {
      const moveFilters: MoveFilter[] = [];

      for (const moveFilter of search.moveFilters ?? []) {
        const moveDefinition = this.getMoveFieldDefinition(moveFilter.field);
        const moveOperator = moveDefinition.operators.includes(
          moveFilter.operator,
        )
          ? moveFilter.operator
          : moveDefinition.operators[0];
        const moveValue = this.coercePrimitive(
          moveFilter.value,
          moveDefinition.type,
        );
        if (!this.hasPrimitiveValue(moveValue)) {
          continue;
        }

        moveFilters.push({
          field: moveDefinition.key,
          operator: moveOperator,
          value: moveValue,
        });
      }

      return {
        field: 'learns',
        operator: 'contains',
        moveMode: search.moveMode === 'or' ? 'or' : 'and',
        moveFilters: moveFilters.length
          ? moveFilters
          : [this.createDefaultMoveFilter()],
      };
    }

    const coercedValue = this.coercePrimitive(
      search.value,
      fieldDefinition.type,
    );
    return {
      field: fieldDefinition.key,
      operator,
      value: this.hasPrimitiveValue(coercedValue)
        ? coercedValue
        : this.getDefaultValueByType(fieldDefinition.type),
    };
  }

  private createDefaultFilter(): SearchFilter {
    const field = this.fields[0];
    return {
      field: field.key,
      operator: field.operators[0],
      value: this.getDefaultValueByType(field.type),
    };
  }

  private createDefaultMoveFilter(): MoveFilter {
    const field = this.moveFields[0];
    return {
      field: field.key,
      operator: field.operators[0],
      value: this.getDefaultValueByType(field.type),
    };
  }

  private getFieldDefinition(field: SearchField): FieldDefinition {
    return this.fields.find((entry) => entry.key === field) ?? this.fields[0];
  }

  private getMoveFieldDefinition(field: MoveField): MoveFieldDefinition {
    return (
      this.moveFields.find((entry) => entry.key === field) ?? this.moveFields[0]
    );
  }

  private getDefaultValueByType(type: SearchFieldType): Primitive {
    switch (type) {
      case 'number':
        return 0;
      case 'boolean':
        return true;
      default:
        return '';
    }
  }

  private coercePrimitive(
    value: Primitive | undefined,
    type: SearchFieldType,
  ): Primitive | undefined {
    if (value === undefined) return undefined;

    if (type === 'number') {
      const asNumber = Number(value);
      return Number.isFinite(asNumber) ? asNumber : undefined;
    }

    if (type === 'boolean') {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', '1', 'fully evolved'].includes(normalized))
        return true;
      if (['false', 'no', '0', 'unevolved'].includes(normalized)) return false;
      return undefined;
    }

    return String(value);
  }
}
