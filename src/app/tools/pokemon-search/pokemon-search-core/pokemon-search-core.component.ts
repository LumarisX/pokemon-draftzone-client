import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IconComponent } from '../../../images/icon/icon.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import {
  PokemonFullData,
  PokemonSearchMoveData,
} from '../../../services/data.service';
import {
  PokemonDialogComponent,
  PokemonDialogData,
} from '../../../components/pokemon-dialog/pokemon-dialog.component';

@Component({
  selector: 'pdz-pokemon-search-core',
  standalone: true,
  imports: [FormsModule, MatDialogModule, SpriteComponent, IconComponent],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent {
  private dialog = inject(MatDialog);

  @Input() rulesetId?: string;
  @Input() formatId?: string;
  @Input() isLoading = false;
  @Input() errorMessage = '';

  @Input()
  set allResults(value: PokemonFullData[] | null) {
    this._allResults = value ?? [];
    this.results = this._allResults;
  }

  results: PokemonFullData[] = [];
  viewMode: 'grid' | 'list' = 'grid';

  private _allResults: PokemonFullData[] = [];

  get hasResults(): boolean {
    return this.results.length > 0;
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
      maxWidth: '420px',
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
    };
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }
}
