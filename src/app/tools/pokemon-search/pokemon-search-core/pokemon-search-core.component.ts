import { Component, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PokemonFullData } from '../../../services/data.service';
import { IconComponent } from '../../../images/icon/icon.component';

@Component({
  selector: 'pdz-pokemon-search-core',
  standalone: true,
  imports: [FormsModule, SpriteComponent, IconComponent],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
})
export class PokemonSearchCoreComponent {
  @Input() rulesetId?: string;
  @Input() formatId?: string;
  @Input() isLoading = false;
  @Input() errorMessage = '';

  @Input()
  set allResults(value: PokemonFullData[] | null) {
    this._allResults = value ?? [];
    this.results = this._allResults;

    if (
      this.selectedPokemon &&
      !this._allResults.some(
        (pokemon) => pokemon.id === this.selectedPokemon?.id,
      )
    ) {
      this.selectedPokemon = null;
    }
  }

  results: PokemonFullData[] = [];
  selectedPokemon: PokemonFullData | null = null;
  viewMode: 'grid' | 'list' = 'grid';

  private _allResults: PokemonFullData[] = [];

  get hasResults(): boolean {
    return this.results.length > 0;
  }

  openSummary(pokemon: PokemonFullData): void {
    this.selectedPokemon = pokemon;
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  closeSummary(): void {
    this.selectedPokemon = null;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeSummary();
  }
}
