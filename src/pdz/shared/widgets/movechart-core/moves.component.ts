import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveChart } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { PokemonTypeComponent } from '@pdz/shared/dialogs/pokemon-type/pokemon-type.component';

@Component({
  selector: 'pdz-moves-core',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
  ],
})
export class MoveCoreComponent {
  @Input()
  movechart?: MoveChart;

  private static readonly VIEW_KEY = 'matchup_moves_view';

  private _view: 'list' | 'cards' =
    (localStorage.getItem(MoveCoreComponent.VIEW_KEY) as 'list' | 'cards') ??
    'cards';

  get view(): 'list' | 'cards' {
    return this._view;
  }
  set view(value: 'list' | 'cards') {
    this._view = value;
    localStorage.setItem(MoveCoreComponent.VIEW_KEY, value);
  }

  selectedTags = new Map<string, 'enable' | 'disable'>();
  showDescription: string | null = null;

  private _searchQuery: string = '';

  get searchQuery(): string {
    return this._searchQuery;
  }

  set searchQuery(value: string) {
    this._searchQuery = value;
    this.selectedTags.clear();
  }

  typeColor = PokemonTypeComponent.typeColor;

  toggleTag(tag: string, mode: 'enable' | 'disable'): void {
    if (this.selectedTags.get(tag) === mode) this.selectedTags.delete(tag);
    else {
      if (mode === 'enable') this.selectedTags.clear();
      this.selectedTags.set(tag, mode);
    }
    this._searchQuery = '';
  }

  get filteredMoves() {
    if (!this.movechart) return [];
    const query = this.searchQuery.trim().toLowerCase();

    return this.movechart.moves.filter((move) => {
      const matchesTag =
        this.selectedTags.size === 0 ||
        (move.tags.some(
          (tag) => tag && this.selectedTags.get(tag) === 'enable',
        ) &&
          !move.tags.some(
            (tag) => tag && this.selectedTags.get(tag) === 'disable',
          ));
      const matchesSearch =
        !query ||
        move.name.toLowerCase().includes(query) ||
        move.type.toLowerCase().includes(query) ||
        move.category.toLowerCase().includes(query);
      return matchesTag && matchesSearch;
    });
  }

  getPokemon(pid: string): Pokemon | undefined {
    if (!this.movechart) return undefined;
    return this.movechart.pokemon.find((p) => p.id === pid);
  }

  toggleDescription(name: string) {
    this.showDescription = this.showDescription === name ? null : name;
  }
}
