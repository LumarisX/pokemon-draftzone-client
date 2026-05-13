import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IconComponent } from '../../../images/icon/icon.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import {
  LeagueTier,
  TierPokemon,
} from '../../../interfaces/tier-pokemon.interface';
import { typeColor } from '../../../util/styling';
import { makeBanString } from '../tier-list.utils';

export interface PokemonDetailDialogData {
  pokemon: TierPokemon & { tier: LeagueTier };
  isDrafted: boolean;
  buttonText?: string;
  altButtonText?: string;
}

export type PokemonDetailDialogResult = {
  action: 'draft';
  teraCapt: boolean;
} | null;

@Component({
  selector: 'pdz-pokemon-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SpriteComponent,
    IconComponent,
  ],
  templateUrl: './pokemon-detail-dialog.component.html',
  styleUrls: ['./pokemon-detail-dialog.component.scss'],
})
export class PokemonDetailDialogComponent {
  dialogRef =
    inject<
      MatDialogRef<PokemonDetailDialogComponent, PokemonDetailDialogResult>
    >(MatDialogRef);
  data = inject<PokemonDetailDialogData>(MAT_DIALOG_DATA);

  typeColor = typeColor;
  makeBanString = makeBanString;

  get pokemonStats(): [string, number][] {
    return Object.entries(this.data.pokemon.stats);
  }

  draft(teraCapt: boolean = false): void {
    this.dialogRef.close({ action: 'draft', teraCapt });
  }
}
