import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveChart } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { typeInk } from '@pdz/core/utils/styling';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

type MoveView = 'list' | 'cards';
type TagMode = 'enable' | 'disable';

@Component({
  selector: 'pdz-moves-core',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    ButtonComponent,
  ],
})
export class MoveCoreComponent {
  readonly movechart = input<MoveChart>();

  private static readonly VIEW_KEY = 'matchup_moves_view';

  readonly view = signal<MoveView>(
    (localStorage.getItem(MoveCoreComponent.VIEW_KEY) as MoveView | null) ??
      'cards',
  );
  readonly searchQuery = signal('');
  readonly selectedTags = signal<ReadonlyMap<string, TagMode>>(new Map());
  readonly showDescription = signal<string | null>(null);

  private readonly pokemonById = computed(
    () =>
      new Map(
        (this.movechart()?.pokemon ?? []).map((pokemon) => [
          pokemon.id,
          pokemon,
        ]),
      ),
  );

  readonly filteredMoves = computed(() => {
    const movechart = this.movechart();
    if (!movechart) return [];
    const query = this.searchQuery().trim().toLowerCase();
    const tags = this.selectedTags();

    return movechart.moves.filter((move) => {
      const matchesTag =
        tags.size === 0 ||
        (move.tags.some((tag) => tag && tags.get(tag) === 'enable') &&
          !move.tags.some((tag) => tag && tags.get(tag) === 'disable'));
      const matchesSearch =
        !query ||
        move.name.toLowerCase().includes(query) ||
        move.type.toLowerCase().includes(query) ||
        move.category.toLowerCase().includes(query);
      return matchesTag && matchesSearch;
    });
  });

  typeColor = typeInk;

  constructor() {
    effect(() => localStorage.setItem(MoveCoreComponent.VIEW_KEY, this.view()));
  }

  search(query: string): void {
    this.searchQuery.set(query);
    this.selectedTags.set(new Map());
  }

  toggleTag(tag: string, mode: TagMode): void {
    const current = this.selectedTags();
    if (current.get(tag) === mode) {
      const next = new Map(current);
      next.delete(tag);
      this.selectedTags.set(next);
    } else {
      const next = new Map<string, TagMode>(mode === 'enable' ? [] : current);
      next.set(tag, mode);
      this.selectedTags.set(next);
    }
    this.searchQuery.set('');
  }

  getPokemon(pid: string): Pokemon | undefined {
    return this.pokemonById().get(pid);
  }

  toggleDescription(name: string) {
    this.showDescription.set(this.showDescription() === name ? null : name);
  }
}
