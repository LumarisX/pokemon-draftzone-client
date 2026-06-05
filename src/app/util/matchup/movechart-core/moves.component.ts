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

  selectedTag: string | null = null;
  showDescription: string | null = null;

  private _searchQuery: string = '';

  get searchQuery(): string {
    return this._searchQuery;
  }

  set searchQuery(value: string) {
    this._searchQuery = value;
    this.selectedTag = null;
  }

  toggleTag(tag: string): void {
    this.selectedTag = this.selectedTag === tag ? null : tag;
    this._searchQuery = '';
  }

  get filteredMoves() {
    if (!this.movechart) return [];
    const query = this.searchQuery.trim().toLowerCase();

    return this.movechart.moves.filter((move) => {
      const matchesTag =
        !this.selectedTag || move.tags.includes(this.selectedTag);
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
