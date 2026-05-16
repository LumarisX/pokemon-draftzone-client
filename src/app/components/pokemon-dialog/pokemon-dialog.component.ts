import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { STATS, StatsTable, Type } from '../../data';
import { IconComponent } from '../../images/icon/icon.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { TierPokemonAddon } from '../../interfaces/tier-pokemon.interface';
import { makeBanString } from '../../league-zone/league-tier-list/tier-list.utils';
import {
  DataService,
  PokemonSearchMoveData,
} from '../../services/data.service';
import { typeColor } from '../../util/styling';
import { PokemonTypeComponent } from '../pokemon-type/pokemon-type.component';

export interface PokemonDialogButton {
  label: string;
  result: unknown;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface PokemonDialogPokemon {
  id: string;
  name: string;
  types: Type[];
  abilities?: string[];
  stats: StatsTable;
  bst: number;
  cst?: number;
  banned?: { moves?: string[]; abilities?: string[]; tera?: true };
  addons?: TierPokemonAddon[];
  moves?: PokemonSearchMoveData[];
}

export interface PokemonDialogData {
  pokemon: PokemonDialogPokemon;
  tier?: { name: string; cost?: number };
  isDrafted?: boolean;
  buttons?: PokemonDialogButton[];
  rulesetId?: string;
  prev?: PokemonDialogData;
  next?: PokemonDialogData;
}

export type PokemonDialogResult = unknown;

@Component({
  selector: 'pdz-pokemon-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
  ],
  templateUrl: './pokemon-dialog.component.html',
  styleUrls: ['./pokemon-dialog.component.scss'],
})
export class PokemonDialogComponent {
  private dataService = inject(DataService);
  dialogRef =
    inject<MatDialogRef<PokemonDialogComponent, PokemonDialogResult>>(
      MatDialogRef,
    );
  data: PokemonDialogData = inject<PokemonDialogData>(MAT_DIALOG_DATA);

  activeTab: string = 'overview';
  moveSearch: string = '';
  movesLoading = false;
  sortColumn: 'type' | 'name' | 'power' | 'accuracy' | 'pp' = 'name';
  sortDir: 1 | -1 = 1;

  get sortedMoves(): PokemonSearchMoveData[] {
    const moves = this.data.pokemon.moves ?? [];
    const q = this.moveSearch.toLowerCase().trim();
    const filtered = q
      ? moves.filter((m) => m.name?.toLowerCase().includes(q))
      : moves;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (this.sortColumn) {
        case 'type':
          cmp = (a.type ?? '').localeCompare(b.type ?? '');
          break;
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '');
          break;
        case 'power':
          cmp = (a.basePower ?? 0) - (b.basePower ?? 0);
          break;
        case 'accuracy':
          cmp =
            (typeof a.accuracy === 'number' ? a.accuracy : 101) -
            (typeof b.accuracy === 'number' ? b.accuracy : 101);
          break;
        case 'pp':
          cmp = (a.pp ?? 0) - (b.pp ?? 0);
          break;
      }
      return cmp * this.sortDir;
    });
  }

  sortByColumn(col: 'type' | 'name' | 'power' | 'accuracy' | 'pp'): void {
    if (this.sortColumn === col) {
      this.sortDir = this.sortDir === 1 ? -1 : 1;
    } else {
      this.sortColumn = col;
      this.sortDir =
        col === 'power' || col === 'accuracy' || col === 'pp' ? -1 : 1;
    }
  }

  categoryIcon(category: string | undefined): string {
    return `/assets/icons/moves/move-${(category ?? 'status').toLowerCase()}.png`;
  }

  isStab(moveType: string | undefined): boolean {
    if (!moveType) return false;
    return this.data.pokemon.types.includes(moveType as any);
  }

  readonly STATS = STATS;
  typeColor = typeColor;
  makeBanString = makeBanString;

  readonly MAX_STAT = 255;

  get pokemonStats(): {
    id: string;
    name: string;
    full: string;
    value: number;
  }[] {
    return STATS.map((s) => ({ ...s, value: this.data.pokemon.stats[s.id] }));
  }

  baseValue = 80;

  statColor(statValue: number | undefined): string | undefined {
    if (statValue === undefined) return undefined;
    const diff = statValue - this.baseValue;
    if (Math.abs(diff) <= 7) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level = Math.min(Math.floor((Math.abs(diff) - 8) / 15) + 1, 5);
    return `var(--pdz-color-scale-${sign}-${level})`;
  }

  bstColor(bstValue: number | undefined): string | undefined {
    if (bstValue === undefined) return undefined;
    const diff = bstValue - this.baseValue * 6;
    if (diff > -25 && diff <= 0) return 'var(--pdz-color-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    let level: number;
    if (diff > 0) {
      level = Math.floor(diff / 25) + 1;
    } else {
      level = Math.floor((Math.abs(diff) - 1) / 25) + 1;
    }
    return `var(--pdz-color-scale-${sign}-${Math.min(level, 7)})`;
  }

  statBarWidth(value: number): string {
    return `${Math.round((value / this.MAX_STAT) * 100)}%`;
  }

  clickButton(result: unknown): void {
    this.dialogRef.close(result);
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'moves' && !this.data.pokemon.moves && this.data.rulesetId) {
      this.movesLoading = true;
      this.dataService
        .getPokemonMoves(this.data.rulesetId, this.data.pokemon.id)
        .pipe(finalize(() => (this.movesLoading = false)))
        .subscribe((moves) => {
          this.data.pokemon.moves = moves;
        });
    }
  }

  navigate(direction: 'prev' | 'next'): void {
    const target = this.data[direction];
    if (target) {
      this.data = target;
      this.moveSearch = '';
      if (
        this.activeTab === 'moves' &&
        !this.data.pokemon.moves &&
        this.data.rulesetId
      ) {
        this.movesLoading = true;
        this.dataService
          .getPokemonMoves(this.data.rulesetId, this.data.pokemon.id)
          .pipe(finalize(() => (this.movesLoading = false)))
          .subscribe((moves) => {
            this.data.pokemon.moves = moves;
          });
      }
    }
  }
}
