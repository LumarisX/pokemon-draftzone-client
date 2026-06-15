import { Location } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { StatsTable } from '@pdz/shared/data';
import {
  DataService,
  PokemonFullData,
  PokemonSearchMoveData,
} from '@pdz/core/services/data.service';
import { SaveSearchesServices } from '../save-searches.service';
import {
  PokemonDialogComponent,
  PokemonDialogData,
} from '@pdz/shared/dialogs/pokemon-dialog/pokemon-dialog.component';
import { PokemonTypeComponent } from '@pdz/shared/dialogs/pokemon-type/pokemon-type.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FilterDrawerComponent } from '../filter-drawer/filter-drawer.component';
import {
  DraftFilter,
  FIELD_CATEGORIES,
  FIELD_DEFINITIONS,
  FieldDefinition,
  LegacySearchPokemonRequest,
  OPERATOR_MAP,
  SearchField,
  SearchFieldType,
  SearchFilter,
  SearchLogicalMode,
  SearchOperator,
  SearchPokemonRequest,
} from '../pokemon-search.types';

@Component({
  selector: 'pdz-pokemon-search-core',
  imports: [
    FormsModule,
    MatDialogModule,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
    FilterDrawerComponent,
    RulesetSelectComponent,
  ],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private bookmarkService = inject(SaveSearchesServices);

  private destroy$ = new Subject<void>();
  private unlistenUrl?: () => void;
  private lastAppliedQuerySignature = '';

  readonly fields = FIELD_DEFINITIONS;
  readonly operatorMap = OPERATOR_MAP;

  @Input() rulesetId?: string;

  copyLinkSuccess = false;
  isBookmarked = false;

  selectedFormat = 'Singles';
  selectedRuleset = 'Gen9 NatDex';
  searchMode: 'quick' | 'advanced' = 'quick';
  quickName = '';
  mode: SearchLogicalMode = 'and';
  filters: SearchFilter[] = [];
  activeFilterCriteria: SearchFilter[] = [];
  isLoading = false;
  errorMessage = '';

  drawerOpen = false;
  editingFilterIndex: number | null = null;
  draftFilter: DraftFilter | null = null;
  fieldMenuOpen = false;

  readonly sortFieldOptions: {
    value: string;
    label: string;
    defaultDir: 'asc' | 'desc';
  }[] = [
    { value: 'num', label: 'Dex #', defaultDir: 'asc' },
    { value: 'name', label: 'Name', defaultDir: 'asc' },
    { value: 'bst', label: 'BST', defaultDir: 'desc' },
    { value: 'cst', label: 'CST', defaultDir: 'desc' },
    { value: 'hp', label: 'HP', defaultDir: 'desc' },
    { value: 'atk', label: 'Attack', defaultDir: 'desc' },
    { value: 'def', label: 'Defense', defaultDir: 'desc' },
    { value: 'spa', label: 'Sp. Atk', defaultDir: 'desc' },
    { value: 'spd', label: 'Sp. Def', defaultDir: 'desc' },
    { value: 'spe', label: 'Speed', defaultDir: 'desc' },
    { value: 'weightkg', label: 'Weight', defaultDir: 'desc' },
  ];

  readonly statList: { key: keyof StatsTable; label: string }[] = [
    { key: 'hp', label: 'HP' },
    { key: 'atk', label: 'Atk' },
    { key: 'def', label: 'Def' },
    { key: 'spa', label: 'SpA' },
    { key: 'spd', label: 'SpD' },
    { key: 'spe', label: 'Spe' },
  ];

  private readonly baseStatValue = 80;
  private readonly maxStatLevel = 7;

  results: PokemonFullData[] = [];
  private allResults: PokemonFullData[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  sortField = 'num';
  sortDir: 'asc' | 'desc' = 'asc';

  get fieldCategories() {
    return FIELD_CATEGORIES;
  }

  get hasResults(): boolean {
    return this.results.length > 0;
  }

  ngOnInit(): void {
    if (this.rulesetId) this.selectedRuleset = this.rulesetId;

    this.checkIfBookmarked();
    this.unlistenUrl = this.location.onUrlChange(() =>
      this.checkIfBookmarked(),
    );
    this.bookmarkService.changed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkIfBookmarked());

    this.route.queryParams.subscribe((params) => {
      if (params['format']) this.selectedFormat = params['format'];
      if (!this.rulesetId && params['ruleset'])
        this.selectedRuleset = params['ruleset'];

      const urlSearchMode = params['searchMode'];

      if (urlSearchMode === 'quick') {
        const q = (params['q'] ?? '').trim();
        if (!q) return;
        const sig = `quick:${q}`;
        if (sig === this.lastAppliedQuerySignature) return;
        this.lastAppliedQuerySignature = sig;
        this.searchMode = 'quick';
        this.quickName = q;
        this.quickSearch();
        return;
      }

      const incomingQuery = params['query'];
      if (!incomingQuery) return;

      const parsed = this.parseIncomingQuery(incomingQuery);
      if (!parsed) return;

      const parsedSignature = JSON.stringify(parsed);
      if (parsedSignature === this.lastAppliedQuerySignature) return;

      this.lastAppliedQuerySignature = parsedSignature;
      this.searchMode = 'advanced';
      this.applyRequest(parsed);
      this.search();
    });
  }

  ngOnDestroy(): void {
    this.unlistenUrl?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  statColor(statValue: number): string {
    const diff = statValue - this.baseStatValue;
    if (Math.abs(diff) <= 7) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level = Math.min(
      Math.floor((Math.abs(diff) - 8) / 15) + 1,
      this.maxStatLevel,
    );
    return `var(--pdz-color-scale-${sign}-${level})`;
  }

  bstColor(bstValue: number): string {
    const diff = bstValue - this.baseStatValue * 6;
    if (diff > -25 && diff <= 0) return 'var(--pdz-color-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level =
      diff > 0
        ? Math.floor(diff / 25) + 1
        : Math.floor((Math.abs(diff) - 1) / 25) + 1;
    return `var(--pdz-color-scale-${sign}-${Math.min(level, this.maxStatLevel)})`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copyLinkSuccess = true;
      setTimeout(() => (this.copyLinkSuccess = false), 2000);
    });
  }

  toggleBookmark(): void {
    const key = SaveSearchesServices.getSearchKey();
    if (!key) return;
    this.isBookmarked = this.bookmarkService.toggle(key, window.location.href);
  }

  private checkIfBookmarked(): void {
    this.isBookmarked = this.bookmarkService.isBookmarked(
      SaveSearchesServices.getSearchKey(),
    );
  }

  fieldsInCategory(category: string): FieldDefinition[] {
    return this.fields.filter((f) => (f.category ?? 'Other') === category);
  }

  quickSearch(): void {
    const value = this.quickName.trim();
    if (!value) {
      this.errorMessage = 'Search value can not be empty.';
      return;
    }

    this.mode = 'or';
    this.filters = [
      { field: 'name', operator: 'contains', value },
      { field: 'types', operator: 'contains', value },
      { field: 'abilities', operator: 'contains', value },
      { field: 'learns', operator: 'contains', value },
    ];

    this.search();
  }

  onRulesetChange(): void {
    if (this.activeFilterCriteria.length > 0) {
      this.search();
    }
  }

  setMode(mode: SearchLogicalMode): void {
    this.mode = mode;
    if (this.filters.length) {
      this.search();
    }
  }

  setSearchMode(mode: 'quick' | 'advanced'): void {
    this.searchMode = mode;
    this.errorMessage = '';
  }

  removeFilter(index: number): void {
    if (this.drawerOpen && this.editingFilterIndex === index) {
      this.closeDrawer();
    }
    this.filters.splice(index, 1);
    if (this.filters.length) {
      this.search();
    } else {
      this.activeFilterCriteria = [];
      this.allResults = [];
      this.results = [];
      this.errorMessage = '';
      this.updateURLQuery({ mode: this.mode, searches: [] });
    }
  }

  resetFilters(): void {
    this.mode = 'or';
    this.filters = [];
    this.activeFilterCriteria = [];
    this.allResults = [];
    this.results = [];
    this.errorMessage = '';
    this.closeDrawer();
    this.updateURLQuery({ mode: this.mode, searches: [] });
  }

  openFieldMenu(): void {
    this.fieldMenuOpen = true;
    this.closeDrawer();
  }

  closeFieldMenu(): void {
    this.fieldMenuOpen = false;
  }

  selectFieldForNewFilter(fieldKey: SearchField): void {
    this.fieldMenuOpen = false;
    const field = this.getFieldDefinition(fieldKey);
    this.draftFilter = {
      field: field.key,
      operator: field.operators[0],
      value: this.getDefaultValueByType(field.type),
      moveMode: 'and',
      moveFilters: [],
    };
    this.editingFilterIndex = null;
    this.drawerOpen = true;
  }

  openEditDrawer(index: number): void {
    const filter = this.filters[index];
    if (!filter) return;
    this.draftFilter = this.filterToDraft(filter);
    this.editingFilterIndex = index;
    this.drawerOpen = true;
  }

  applyDrawerFilter(committed: SearchFilter): void {
    if (this.editingFilterIndex !== null) {
      this.filters[this.editingFilterIndex] = committed;
    } else {
      this.filters.push(committed);
    }
    this.closeDrawer();
    this.search();
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.draftFilter = null;
    this.editingFilterIndex = null;
  }

  getPillLabel(filter: SearchFilter): string {
    const fieldDef = this.getFieldDefinition(filter.field);
    const op = OPERATOR_MAP[filter.operator].symbol;
    return `${fieldDef.label} ${op} ${filter.value}`;
  }

  getPillAriaLabel(filter: SearchFilter, index: number): string {
    return `Filter ${index + 1}: ${this.getPillLabel(filter)}. Press Enter to edit.`;
  }

  openSummary(pokemon: PokemonFullData): void {
    const dataList = this.results.map((p) => this.buildDialogData(p));
    dataList.forEach((d, i) => {
      if (i > 0) d.prev = dataList[i - 1];
      if (i < dataList.length - 1) d.next = dataList[i + 1];
    });

    const idx = this.results.indexOf(pokemon);
    const data = idx >= 0 ? dataList[idx] : this.buildDialogData(pokemon);

    this.dialog.open(PokemonDialogComponent, {
      data,
      maxWidth: '30rem',
      width: '92vw',
      panelClass: 'pokemon-detail-panel',
    });
  }

  private buildDialogData(pokemon: PokemonFullData): PokemonDialogData {
    const learns = pokemon.learns;
    const moves =
      Array.isArray(learns) &&
      learns.length > 0 &&
      typeof learns[0] !== 'string'
        ? (learns as PokemonSearchMoveData[])
        : undefined;
    return {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types,
        abilities: pokemon.abilities,
        stats: pokemon.baseStats,
        bst: pokemon.bst,
        cst: pokemon.cst,
        moves,
      },
      rulesetId: this.selectedRuleset,
    };
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  onSortFieldChange(): void {
    const opt = this.sortFieldOptions.find((o) => o.value === this.sortField);
    if (opt) this.sortDir = opt.defaultDir;
    this.applySort();
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.applySort();
  }

  private applySort(): void {
    const mult = this.sortDir === 'asc' ? 1 : -1;
    this.results = [...this.allResults].sort((a, b) => {
      const aVal = this.getSortValue(a);
      const bVal = this.getSortValue(b);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * mult;
      }
      return ((aVal as number) - (bVal as number)) * mult;
    });
  }

  private getSortValue(pokemon: PokemonFullData): string | number {
    switch (this.sortField) {
      case 'name':
        return pokemon.name;
      case 'bst':
        return pokemon.bst;
      case 'spe':
        return pokemon.spe;
      case 'atk':
        return pokemon.atk;
      case 'def':
        return pokemon.def;
      case 'spa':
        return pokemon.spa;
      case 'spd':
        return pokemon.spd;
      case 'hp':
        return pokemon.hp;
      case 'cst':
        return pokemon.cst;
      case 'gen':
        return pokemon.gen;
      case 'weightkg':
        return pokemon.weightkg;
      default:
        return pokemon.num;
    }
  }

  search(): void {
    const searches = this.getSanitizedFilters();
    if (!searches.length) {
      this.errorMessage = 'Add at least one valid filter before searching.';
      this.activeFilterCriteria = [];
      this.allResults = [];
      this.results = [];
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.activeFilterCriteria = searches;

    const query: SearchPokemonRequest = { mode: this.mode, searches };
    this.updateURLQuery(query);

    this.dataService
      .getPokemonList(this.selectedRuleset)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.allResults = this.applyClientFilters(response, query);
          this.applySort();
        },
        error: (error) => {
          this.activeFilterCriteria = searches;
          this.allResults = [];
          this.results = [];
          this.errorMessage = error?.error?.message || 'Search request failed.';
        },
      });
  }

  private updateURLQuery(queryValue: SearchPokemonRequest): void {
    const currentPath = this.location.path().split('?')[0];
    const queryParts = [
      `format=${encodeURIComponent(this.selectedFormat)}`,
      `ruleset=${encodeURIComponent(this.selectedRuleset)}`,
      `searchMode=${this.searchMode}`,
    ];

    if (this.searchMode === 'quick') {
      queryParts.push(`q=${encodeURIComponent(this.quickName.trim())}`);
    } else if (queryValue.searches.length > 0) {
      queryParts.push(
        `query=${encodeURIComponent(JSON.stringify(queryValue))}`,
      );
    }

    this.location.replaceState(`${currentPath}?${queryParts.join('&')}`);
  }

  private parseIncomingQuery(
    value: string | SearchPokemonRequest,
  ): LegacySearchPokemonRequest | null {
    if (typeof value !== 'string') return value;
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
    return this.filters
      .filter((f) => this.hasPrimitiveValue(f.value))
      .map((f) => ({ field: f.field, operator: f.operator, value: f.value }));
  }

  private filterToDraft(filter: SearchFilter): DraftFilter {
    return {
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      moveMode: 'and',
      moveFilters: [],
    };
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

  private getFieldDefinition(field: SearchField) {
    return this.fields.find((entry) => entry.key === field) ?? this.fields[0];
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
    if (!request.searches.length) return pokemonList;
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
    if (filter.value === undefined) return false;
    const fieldType = this.getFieldDefinition(filter.field).type;
    const fieldValue = this.resolvePokemonFieldValue(pokemon, filter.field);
    if (fieldValue === undefined) return false;
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
      case 'mythical':
        return pokemon.tags.includes('Mythical');
      case 'restrictedLegendary':
        return pokemon.tags.includes('Restricted Legendary');
      case 'subLegendary':
        return pokemon.tags.includes('Sub-Legendary');
      case 'ultraBeast':
        return pokemon.tags.includes('Ultra Beast');
      case 'paradox':
        return pokemon.tags.includes('Paradox');
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
    if (Array.isArray(fieldValue)) return Number.NaN;
    if (fieldType === 'number') {
      const left = Number(fieldValue);
      const right = Number(filterValue);
      if (!Number.isFinite(left) || !Number.isFinite(right)) return Number.NaN;
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
        this.compareContains(value, filterValue, fieldType),
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
    if (fieldType === 'number') return Number(left) === Number(right);
    if (fieldType === 'boolean') return Boolean(left) === Boolean(right);
    return (
      this.normalizeString(String(left)) === this.normalizeString(String(right))
    );
  }

  private normalizeString(value: string): string {
    return value.trim().toLowerCase();
  }
}
