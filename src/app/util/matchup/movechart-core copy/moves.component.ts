import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PokemonTypeComponent } from '../../../components/pokemon-type/pokemon-type.component';
import { MoveChart } from '../../../drafts/matchup-overview/matchup-interface';
import { IconComponent } from '../../../images/icon/icon.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/pokemon';

@Component({
  selector: 'pdz-moves-core',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    PokemonTypeComponent,
    IconComponent,
  ],
})
export class MoveCoreComponent {
  @Input()
  movechart?: MoveChart;

  selectedTags = new Set<string>();
  showDescription: string | null = null;

  private _searchQuery: string = '';

  get searchQuery(): string {
    return this._searchQuery;
  }

  set searchQuery(value: string) {
    this._searchQuery = value;
    this.selectedTags.clear();
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) this.selectedTags.delete(tag);
    else this.selectedTags.add(tag);
    this._searchQuery = '';
  }

  get filteredMoves() {
    if (!this.movechart) return [];
    const query = this.searchQuery.trim().toLowerCase();

    return this.movechart.moves.filter((move) => {
      const matchesTag =
        this.selectedTags.size === 0 ||
        move.tags.some((tag) => tag && this.selectedTags.has(tag));
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
