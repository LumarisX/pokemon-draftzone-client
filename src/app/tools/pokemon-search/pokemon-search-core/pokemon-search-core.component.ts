import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconComponent } from '../../../images/icon/icon.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PokemonTypeComponent } from '../../../components/pokemon-type/pokemon-type.component';
import {
  PokemonFullData,
  PokemonSearchMoveData,
} from '../../../services/data.service';
import { StatsTable } from '../../../data';
import {
  PokemonDialogComponent,
  PokemonDialogData,
} from '../../../components/pokemon-dialog/pokemon-dialog.component';
import { SaveSearchesServices } from '../../../services/save-searches.service';

@Component({
  selector: 'pdz-pokemon-search-core',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
  ],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private location = inject(Location);
  private bookmarkService = inject(SaveSearchesServices);

  private destroy$ = new Subject<void>();
  private unlistenUrl?: () => void;

  copyLinkSuccess = false;
  isBookmarked = false;

  @Input() rulesetId?: string;
  @Input() formatId?: string;
  @Input() isLoading = false;
  @Input() errorMessage = '';

  @Input()
  set allResults(value: PokemonFullData[] | null) {
    this._allResults = value ?? [];
    this.applySort();
  }

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

  results: PokemonFullData[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  sortField = 'num';
  sortDir: 'asc' | 'desc' = 'asc';

  private _allResults: PokemonFullData[] = [];

  get hasResults(): boolean {
    return this.results.length > 0;
  }

  ngOnInit(): void {
    this.checkIfBookmarked();
    this.unlistenUrl = this.location.onUrlChange(() =>
      this.checkIfBookmarked(),
    );
    this.bookmarkService.changed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkIfBookmarked();
      });
  }

  ngOnDestroy(): void {
    this.unlistenUrl?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copyLinkSuccess = true;
      setTimeout(() => {
        this.copyLinkSuccess = false;
      }, 2000);
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
      rulesetId: this.rulesetId,
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
    this.results = [...this._allResults].sort((a, b) => {
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
}
