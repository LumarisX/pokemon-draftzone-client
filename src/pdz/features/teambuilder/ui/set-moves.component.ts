import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { toID } from '@pdz/sets';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import type { LearnsetMove } from '../data/teambuilder.models';
import { TeambuilderService } from '../data/teambuilder.service';
import { TeamStore } from '../state/team-store';

export type MoveSort = 'strength' | 'name' | 'type' | 'power' | 'accuracy';

interface MoveSlot {
  readonly index: number;
  readonly id: string | null;
  readonly move: LearnsetMove | null;
}

@Component({
  selector: 'pdz-set-moves',
  templateUrl: './set-moves.component.html',
  styleUrl: './set-moves.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    LoadingComponent,
    PokemonTypeComponent,
  ],
})
export class SetMovesComponent {
  protected readonly store = inject(TeamStore);
  private readonly service = inject(TeambuilderService);

  protected readonly query = signal('');
  protected readonly sort = signal<MoveSort>('strength');
  protected readonly slot = signal(0);

  private readonly request = computed(() => {
    const set = this.store.activeSet();
    const species = this.store.activeSpecies();
    const ruleset = this.store.ruleset();
    if (!set || !species || !ruleset) return undefined;
    return {
      id: set.id,
      ruleset,
      types: species.types,
      ability: set.ability,
      teraType: set.teraType,
    };
  });

  protected readonly learnset = rxResource({
    params: this.request,
    stream: ({ params }) => this.service.getLearnset(params),
    defaultValue: [] as LearnsetMove[],
  });

  constructor() {
    effect(() => {
      const moves = this.learnset.value();
      if (moves.length > 0) {
        untracked(() => this.store.rememberMoveNames(moves));
      }
    });
  }

  protected readonly slots = computed<MoveSlot[]>(() => {
    const set = this.store.activeSet();
    const moves = this.learnset.value();
    if (!set) return [];
    return set.moves.map((id, index) => ({
      index,
      id,
      move: id ? (moves.find((move) => move.id === toID(id)) ?? null) : null,
    }));
  });

  protected readonly visible = computed<LearnsetMove[]>(() => {
    const terms = this.query().toLowerCase().trim().split(/\s+/).filter(Boolean);
    const filtered = terms.reduce(
      (moves, term) => filterByTerm(moves, term),
      this.learnset.value(),
    );
    return sortMoves(filtered, this.sort());
  });

  protected select(move: LearnsetMove): void {
    this.store.toggleMove(this.slot(), move.id);
    this.query.set('');
    this.focusNextEmptySlot();
  }

  protected clear(index: number): void {
    this.store.updateActive((set) => {
      const moves = [...set.moves];
      moves[index] = null;
      return { ...set, moves };
    });
    this.slot.set(index);
  }

  protected isSelected(move: LearnsetMove): boolean {
    const set = this.store.activeSet();
    return (
      set?.moves.some((id) => id !== null && toID(id) === move.id) ?? false
    );
  }

  protected sortBy(column: MoveSort): void {
    this.sort.set(column);
  }

  protected accuracyLabel(move: LearnsetMove): string {
    return move.accuracy === true ? '—' : `${move.accuracy}%`;
  }

  protected powerLabel(move: LearnsetMove): string {
    return move.basePower > 0 ? `${move.basePower}` : '—';
  }

  private focusNextEmptySlot(): void {
    const set = this.store.activeSet();
    if (!set) return;
    const next = set.moves.findIndex((id) => id === null);
    if (next >= 0) this.slot.set(next);
  }
}

function normalize(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function filterByTerm(moves: LearnsetMove[], term: string): LearnsetMove[] {
  const inverse = term.startsWith('!');
  const needle = normalize(inverse ? term.slice(1) : term);
  if (!needle) return moves;
  return moves.filter((move) => {
    const match =
      normalize(move.name).includes(needle) ||
      normalize(move.type).includes(needle) ||
      normalize(move.category).includes(needle) ||
      move.tags.some((tag) => normalize(tag).includes(needle));
    return inverse ? !match : match;
  });
}

function sortMoves(moves: LearnsetMove[], sort: MoveSort): LearnsetMove[] {
  const accuracy = (move: LearnsetMove) =>
    move.accuracy === true ? 100 : move.accuracy;
  return [...moves].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      case 'power':
        return b.basePower - a.basePower;
      case 'accuracy':
        return accuracy(b) - accuracy(a);
      case 'strength':
      default:
        return b.strength - a.strength;
    }
  });
}
