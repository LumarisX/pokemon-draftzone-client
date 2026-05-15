import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { STATS, StatsTable, Type } from '../../data';
import { IconComponent } from '../../images/icon/icon.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { TierPokemonAddon } from '../../interfaces/tier-pokemon.interface';
import { makeBanString } from '../../league-zone/league-tier-list/tier-list.utils';
import { PokemonSearchMoveData } from '../../services/data.service';
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
  dialogRef =
    inject<MatDialogRef<PokemonDialogComponent, PokemonDialogResult>>(
      MatDialogRef,
    );
  data: PokemonDialogData = inject<PokemonDialogData>(MAT_DIALOG_DATA);

  activeTab: string = 'overview';
  moveSearch: string = '';

  get filteredMoves(): PokemonSearchMoveData[] {
    const moves = this.data.pokemon.moves ?? [];
    const q = this.moveSearch.toLowerCase().trim();
    if (!q) return moves;
    return moves.filter((m) => m.name?.toLowerCase().includes(q));
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

  // statColor(value: number): string {
  //   if (value >= 130) return 'var(--pdz-color-scale-positive-6)';
  //   if (value >= 110) return 'var(--pdz-color-scale-positive-2)';
  //   if (value >= 80) return 'var(--pdz-color-scale-positive-4)';
  //   if (value >= 80) return 'var(--pdz-color-scale-positive-3)';
  //   if (value >= 80) return 'var(--pdz-color-scale-positive-2)';
  //   if (value >= 80) return 'var(--pdz-color-scale-positive-1)';
  //   if (value >= 70) return 'var(--pdz-color-neutral)';
  //   if (value >= 60) return 'var(--pdz-color-scale-negative-1)';
  //   if (value >= 50) return 'var(--pdz-color-scale-negative-2)';
  //   if (value >= 40) return 'var(--pdz-color-scale-negative-3)';
  //   if (value >= 30) return 'var(--pdz-color-scale-negative-4)';

  //   return 'var(--pdz-color-scale-negative-5)';
  // }

  // bstColor(bst: number): string {
  //   if (bst >= 650) return 'var(--pdz-color-scale-positive-6)';
  //   if (bst >= 600) return 'var(--pdz-color-scale-positive-4)';
  //   if (bst >= 550) return 'var(--pdz-color-scale-positive-2)';
  //   if (bst >= 500) return 'var(--pdz-color-neutral)';
  //   if (bst >= 450) return 'var(--pdz-color-scale-negative-1)';
  //   if (bst >= 400) return 'var(--pdz-color-scale-negative-3)';
  //   return 'var(--pdz-color-scale-negative-5)';
  // }

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
    if (diff > -25 && diff <= 0) return 'var(--pdz-color-scale-neutral)';
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

  navigate(direction: 'prev' | 'next'): void {
    const target = this.data[direction];
    if (target) this.data = target;
  }
}
