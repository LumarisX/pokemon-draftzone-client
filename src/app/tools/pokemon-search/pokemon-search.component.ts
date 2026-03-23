import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DataService, PokemonFullData } from '../../services/data.service';
import {
  FIELD_DEFINITIONS,
  LegacySearchPokemonRequest,
  MOVE_FIELD_DEFINITIONS,
  MoveField,
  MoveFilter,
  SearchField,
  SearchFieldType,
  SearchFilter,
  SearchLogicalMode,
  SearchOperator,
  SearchPokemonRequest,
} from './pokemon-search.types';
import { PokemonSearchCoreComponent } from './pokemon-search-core/pokemon-search-core.component';

@Component({
  selector: 'pdz-pokemon-search',
  standalone: true,
  templateUrl: './pokemon-search.component.html',
  styleUrl: './pokemon-search.component.scss',
  imports: [RouterModule, FormsModule, PokemonSearchCoreComponent],
})
export class PokemonSearchComponent implements OnInit {
  private dataService = inject(DataService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

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

  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';
  searchMode: 'quick' | 'advanced' = 'quick';
  quickName = '';
  mode: SearchLogicalMode = 'or';
  filters: SearchFilter[] = [this.createDefaultFilter()];
  activeFilterCriteria: SearchFilter[] = [];
  allResults: PokemonFullData[] = [];
  isLoading = false;
  errorMessage = '';

  private lastAppliedQuerySignature = '';

  ngOnInit() {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });

    this.route.queryParams.subscribe((params) => {
      if (params['format']) this.selectedFormat = params['format'];
      if (params['ruleset']) this.selectedRuleset = params['ruleset'];

      const incomingQuery = params['query'];
      if (!incomingQuery) {
        return;
      }

      const parsed = this.parseIncomingQuery(incomingQuery);
      if (!parsed) {
        return;
      }

      const parsedSignature = JSON.stringify(parsed);
      if (parsedSignature === this.lastAppliedQuerySignature) {
        return;
      }

      this.lastAppliedQuerySignature = parsedSignature;
      this.applyRequest(parsed);
      this.search();
    });
  }

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

    this.search();
  }

  runAdvancedSearch(): void {
    this.search();
  }

  setSearchMode(mode: 'quick' | 'advanced'): void {
    this.searchMode = mode;
    this.errorMessage = '';
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
    this.filters = [this.createDefaultFilter()];
    this.activeFilterCriteria = [];
    this.allResults = [];
    this.errorMessage = '';
  }

  fieldOperators(field: SearchField): SearchOperator[] {
    return this.getFieldDefinition(field).operators;
  }

  moveFieldOperators(field: MoveField): SearchOperator[] {
    return this.getMoveFieldDefinition(field).operators;
  }

  search(): void {
    const searches = this.getSanitizedFilters();
    if (!searches.length) {
      this.errorMessage = 'Add at least one valid filter before searching.';
      this.activeFilterCriteria = [];
      this.allResults = [];
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.activeFilterCriteria = searches;

    const query: SearchPokemonRequest = {
      mode: this.mode,
      searches,
    };

    this.updateURLQuery(query);

    this.dataService
      .getPokemonList(this.selectedRuleset)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.allResults = this.applyClientFilters(response, query);
        },
        error: (error) => {
          this.activeFilterCriteria = searches;
          this.allResults = [];
          this.errorMessage = error?.error?.message || 'Search request failed.';
        },
      });
  }

  updateURLQuery(queryValue: SearchPokemonRequest) {
    const currentPath = this.location.path().split('?')[0];
    const compactQuery = this.compactQueryForUrl(queryValue);
    const queryParts = [
      `format=${encodeURIComponent(this.selectedFormat)}`,
      `ruleset=${encodeURIComponent(this.selectedRuleset)}`,
    ];

    if (compactQuery) {
      queryParts.push(`query=${encodeURIComponent(compactQuery)}`);
    }

    const updatedUrl = `${currentPath}?${queryParts.join('&')}`;
    this.location.replaceState(updatedUrl);
  }

  private compactQueryForUrl(queryValue: SearchPokemonRequest): string {
    return JSON.stringify(queryValue);
  }

  private parseIncomingQuery(
    value: string | SearchPokemonRequest,
  ): LegacySearchPokemonRequest | null {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed) as LegacySearchPokemonRequest;
    } catch {
      try {
        return JSON.parse(
          decodeURIComponent(trimmed),
        ) as LegacySearchPokemonRequest;
      } catch {
        return null;
      }
    }
  }

  private applyRequest(request: LegacySearchPokemonRequest): void {
    this.mode = request.mode === 'or' ? 'or' : 'and';

    const nextFilters = request.searches
      .map((search) => this.normalizeFilter(search))
      .filter((search): search is SearchFilter => Boolean(search));

    this.filters = nextFilters.length
      ? nextFilters
      : [this.createDefaultFilter()];
  }

  private normalizeFilter(search: SearchFilter): SearchFilter | null {
    const normalizedField =
      search.field === 'requiredItems' ? 'requiredItem' : search.field;
    const fieldDefinition = this.getFieldDefinition(normalizedField);
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

  private hasPrimitiveValue(
    value: string | number | boolean | undefined,
  ): value is string | number | boolean {
    if (typeof value === 'boolean' || typeof value === 'number') return true;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
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

  private getFieldDefinition(field: SearchField) {
    return this.fields.find((entry) => entry.key === field) ?? this.fields[0];
  }

  private getMoveFieldDefinition(field: MoveField) {
    return (
      this.moveFields.find((entry) => entry.key === field) ?? this.moveFields[0]
    );
  }

  private getDefaultValueByType(
    type: SearchFieldType,
  ): string | number | boolean {
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
    value: string | number | boolean | undefined,
    type: SearchFieldType,
  ): string | number | boolean | undefined {
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

  private applyClientFilters(
    pokemonList: PokemonFullData[],
    request: SearchPokemonRequest,
  ): PokemonFullData[] {
    if (!request.searches.length) {
      return pokemonList;
    }

    return pokemonList.filter((pokemon) =>
      this.matchesSearches(pokemon, request.searches, request.mode),
    );
  }

  private matchesSearches(
    pokemon: PokemonFullData,
    filters: SearchFilter[],
    mode: SearchLogicalMode,
  ): boolean {
    if (!filters.length) return true;

    if (mode === 'or') {
      return filters.some((filter) =>
        this.matchesSingleFilter(pokemon, filter),
      );
    }

    return filters.every((filter) => this.matchesSingleFilter(pokemon, filter));
  }

  private matchesSingleFilter(
    pokemon: PokemonFullData,
    filter: SearchFilter,
  ): boolean {
    if (filter.field === 'learns' && filter.moveFilters?.length) {
      return this.matchesMoveFilters(
        pokemon,
        filter.moveFilters,
        filter.moveMode ?? 'and',
      );
    }

    if (filter.value === undefined) {
      return false;
    }

    const fieldType = this.getFieldDefinition(filter.field).type;
    const fieldValue = this.resolvePokemonFieldValue(pokemon, filter.field);
    if (fieldValue === undefined) {
      return false;
    }

    return this.compareFilterValues(
      fieldValue,
      filter.operator,
      filter.value,
      fieldType,
    );
  }

  private resolvePokemonFieldValue(
    pokemon: PokemonFullData,
    field: SearchField,
  ): string | number | boolean | Array<string | number | boolean> | undefined {
    switch (field) {
      case 'id':
        return pokemon.id;
      case 'name':
      case 'fullname':
        return pokemon.name;
      case 'baseSpecies':
        return pokemon.baseSpecies;
      case 'num':
        return pokemon.num;
      case 'gen':
        return pokemon.gen;
      case 'tier':
        return pokemon.tier;
      case 'natDexTier':
        return pokemon.natDexTier;
      case 'doublesTier':
        return pokemon.doublesTier;
      case 'isNonstandard':
        return pokemon.isNonstandard;
      case 'types':
        return pokemon.types;
      case 'abilities':
        return pokemon.abilities;
      case 'eggGroups':
        return pokemon.eggGroups;
      case 'weaks':
        return pokemon.weaks;
      case 'resists':
        return pokemon.resists;
      case 'immunities':
        return pokemon.immunities;
      case 'tags':
        return pokemon.tags;
      case 'weightkg':
        return pokemon.weightkg;
      case 'bst':
        return pokemon.bst;
      case 'cst':
        return pokemon.cst;
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
      case 'nfe':
        return pokemon.nfe;
      case 'evolved':
        return pokemon.evolved;
      case 'isMega':
        return pokemon.isMega;
      case 'isPrimal':
        return pokemon.isPrimal;
      case 'isGigantamax':
        return pokemon.isGigantamax;
      case 'prevo':
        return pokemon.prevo;
      case 'evos':
        return pokemon.evos;
      case 'requiredAbility':
        return pokemon.requiredAbility;
      case 'requiredItem':
      case 'requiredItems':
        return pokemon.requiredItem;
      case 'requiredMove':
        return pokemon.requiredMove;
      case 'coverage':
        return pokemon.coverage;
      case 'learns':
        return this.getPokemonMoveNames(pokemon);
      default:
        return undefined;
    }
  }

  private getPokemonMoveNames(pokemon: PokemonFullData): string[] {
    const learns = pokemon.learns;
    if (Array.isArray(learns) && learns.length > 0) {
      if (typeof learns[0] === 'string') {
        return learns as string[];
      }

      return (learns as Array<{ id?: string; name?: string }>)
        .flatMap((move) => [move.id ?? '', move.name ?? ''])
        .filter((value) => value.length > 0);
    }

    return pokemon.coverage;
  }

  private matchesMoveFilters(
    pokemon: PokemonFullData,
    moveFilters: MoveFilter[],
    mode: SearchLogicalMode,
  ): boolean {
    const moves = this.resolvePokemonMoves(pokemon);
    if (!moves.length) {
      return false;
    }

    for (const move of moves) {
      const passes =
        mode === 'or'
          ? moveFilters.some((filter) =>
              this.matchesSingleMoveFilter(move, filter),
            )
          : moveFilters.every((filter) =>
              this.matchesSingleMoveFilter(move, filter),
            );

      if (passes) {
        return true;
      }
    }

    return false;
  }

  private resolvePokemonMoves(pokemon: PokemonFullData): Array<{
    id: string;
    name: string;
    type?: string;
    category?: string;
    basePower?: number;
    accuracy?: number | boolean;
    pp?: number;
    priority?: number;
    target?: string;
  }> {
    const learns = pokemon.learns;
    if (Array.isArray(learns) && learns.length > 0) {
      if (typeof learns[0] === 'string') {
        return (learns as string[]).map((name) => ({
          id: this.toMoveId(name),
          name,
        }));
      }

      return (
        learns as Array<{
          id?: string;
          name?: string;
          type?: string;
          category?: string;
          basePower?: number;
          accuracy?: number | boolean;
          pp?: number;
          priority?: number;
          target?: string;
        }>
      ).map((move) => ({
        id: move.id || this.toMoveId(move.name ?? ''),
        name: move.name ?? move.id ?? '',
        type: move.type,
        category: move.category,
        basePower: move.basePower,
        accuracy: move.accuracy,
        pp: move.pp,
        priority: move.priority,
        target: move.target,
      }));
    }

    return (pokemon.coverage ?? []).map((name) => ({
      id: this.toMoveId(name),
      name,
    }));
  }

  private toMoveId(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private matchesSingleMoveFilter(
    move: {
      id: string;
      name: string;
      type?: string;
      category?: string;
      basePower?: number;
      accuracy?: number | boolean;
      pp?: number;
      priority?: number;
      target?: string;
    },
    filter: MoveFilter,
  ): boolean {
    const fieldType = this.getMoveFieldDefinition(filter.field).type;
    const fieldValue = this.resolveMoveFieldValue(move, filter.field);

    if (fieldValue === undefined) {
      return false;
    }

    return this.compareFilterValues(
      fieldValue,
      filter.operator,
      filter.value,
      fieldType,
    );
  }

  private resolveMoveFieldValue(
    move: {
      id: string;
      name: string;
      type?: string;
      category?: string;
      basePower?: number;
      accuracy?: number | boolean;
      pp?: number;
      priority?: number;
      target?: string;
    },
    field: MoveField,
  ): string | number | boolean | undefined {
    switch (field) {
      case 'name':
        return move.name;
      case 'type':
        return move.type;
      case 'category':
        return move.category;
      case 'basePower':
        return move.basePower;
      case 'accuracy':
        if (typeof move.accuracy === 'boolean') {
          return move.accuracy ? 101 : 0;
        }
        return move.accuracy;
      case 'pp':
        return move.pp;
      case 'priority':
        return move.priority;
      case 'target':
        return move.target;
      default:
        return undefined;
    }
  }

  private compareFilterValues(
    fieldValue: string | number | boolean | Array<string | number | boolean>,
    operator: SearchOperator,
    filterValue: string | number | boolean,
    fieldType: SearchFieldType,
  ): boolean {
    switch (operator) {
      case 'eq':
        return this.compareEquals(fieldValue, filterValue, fieldType);
      case 'ne':
        return !this.compareEquals(fieldValue, filterValue, fieldType);
      case 'gt':
        return this.compareOrdered(fieldValue, filterValue, fieldType) > 0;
      case 'gte':
        return this.compareOrdered(fieldValue, filterValue, fieldType) >= 0;
      case 'lt':
        return this.compareOrdered(fieldValue, filterValue, fieldType) < 0;
      case 'lte':
        return this.compareOrdered(fieldValue, filterValue, fieldType) <= 0;
      case 'contains':
        return this.compareContains(fieldValue, filterValue, fieldType);
      case 'notContains':
        return !this.compareContains(fieldValue, filterValue, fieldType);
      case 'in':
        return this.compareIn(fieldValue, filterValue, fieldType);
      case 'nin':
        return !this.compareIn(fieldValue, filterValue, fieldType);
      default:
        return false;
    }
  }

  private compareEquals(
    fieldValue: string | number | boolean | Array<string | number | boolean>,
    filterValue: string | number | boolean,
    fieldType: SearchFieldType,
  ): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.some((value) =>
        this.compareScalar(value, filterValue, fieldType),
      );
    }

    return this.compareScalar(fieldValue, filterValue, fieldType);
  }

  private compareOrdered(
    fieldValue: string | number | boolean | Array<string | number | boolean>,
    filterValue: string | number | boolean,
    fieldType: SearchFieldType,
  ): number {
    if (Array.isArray(fieldValue)) {
      return Number.NaN;
    }

    if (fieldType === 'number') {
      const left = Number(fieldValue);
      const right = Number(filterValue);
      if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return Number.NaN;
      }

      return left - right;
    }

    const left = this.normalizeString(String(fieldValue));
    const right = this.normalizeString(String(filterValue));
    return left.localeCompare(right);
  }

  private compareContains(
    fieldValue: string | number | boolean | Array<string | number | boolean>,
    filterValue: string | number | boolean,
    fieldType: SearchFieldType,
  ): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.some((value) =>
        this.compareScalar(value, filterValue, fieldType),
      );
    }

    if (fieldType === 'string') {
      return this.normalizeString(String(fieldValue)).includes(
        this.normalizeString(String(filterValue)),
      );
    }

    return this.compareScalar(fieldValue, filterValue, fieldType);
  }

  private compareIn(
    fieldValue: string | number | boolean | Array<string | number | boolean>,
    filterValue: string | number | boolean,
    fieldType: SearchFieldType,
  ): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.some((value) =>
        this.compareScalar(value, filterValue, fieldType),
      );
    }

    return this.compareScalar(fieldValue, filterValue, fieldType);
  }

  private compareScalar(
    left: string | number | boolean,
    right: string | number | boolean,
    fieldType: SearchFieldType,
  ): boolean {
    if (fieldType === 'number') {
      return Number(left) === Number(right);
    }

    if (fieldType === 'boolean') {
      return Boolean(left) === Boolean(right);
    }

    return (
      this.normalizeString(String(left)) === this.normalizeString(String(right))
    );
  }

  private normalizeString(value: string): string {
    return value.trim().toLowerCase();
  }
}
