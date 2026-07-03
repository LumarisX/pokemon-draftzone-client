import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  DataService,
  PokemonSearchMoveData,
} from '@pdz/core/services/data.service';
import { TierPokemonAddon } from '@pdz/features/tier-lists/tier-list.model';
import { StatsTable, Type } from '@pdz/shared/data';
import { finalize } from 'rxjs/operators';

export interface MoveDialogButton {
  label: string;
  result: unknown;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface MoveDialogPokemon {
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

export interface MoveDialogData {
  pokemon: MoveDialogPokemon;
  tier?: { name: string; cost?: number };
  isDrafted?: boolean;
  buttons?: MoveDialogButton[];
  rulesetId?: string;
  prev?: MoveDialogData;
  next?: MoveDialogData;
}

export type MoveDialogResult = unknown;

@Component({
  selector: 'pdz-move-dialog',
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './move-dialog.component.html',
  styleUrls: ['./move-dialog.component.scss'],
})
export class MoveDialogComponent {
  private dataService = inject(DataService);
  dialogRef =
    inject<MatDialogRef<MoveDialogComponent, MoveDialogResult>>(MatDialogRef);
  data: MoveDialogData = inject<MoveDialogData>(MAT_DIALOG_DATA);

  activeTab: string = 'overview';
  moveSearch: string = '';
  movesLoading = false;
  sortColumn: 'type' | 'name' | 'power' | 'accuracy' | 'pp' = 'name';
  sortDir: 1 | -1 = 1;

  sortByColumn(col: 'type' | 'name' | 'power' | 'accuracy' | 'pp'): void {
    if (this.sortColumn === col) {
      this.sortDir = this.sortDir === 1 ? -1 : 1;
    } else {
      this.sortColumn = col;
      this.sortDir =
        col === 'power' || col === 'accuracy' || col === 'pp' ? -1 : 1;
    }
  }

  clickButton(result: unknown): void {
    this.dialogRef.close(result);
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
