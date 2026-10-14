import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

@Component({
  selector: 'pdz-roster-pattern',
  imports: [SpriteComponent],
  template: `
    <div class="pdz-roster-pattern__field">
      @for (pokemon of tiles(); track $index) {
        <pdz-sprite
          size="fill"
          [pokemon]="pokemon"
          [showFormes]="false"
        />
      }
    </div>
  `,
  styleUrl: './roster-pattern.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-roster-pattern',
    'aria-hidden': 'true',
  },
})
export class RosterPatternComponent {
  readonly pokemon = input.required<Pokemon<DraftOptions>[]>();
  readonly count = input(220);

  protected readonly tiles = computed(() =>
    scatter(this.pokemon(), this.count()),
  );
}

function shuffled<T>(items: readonly T[], seed: number): T[] {
  const order = [...items];
  let state = seed >>> 0;
  for (let index = order.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  return order;
}

export function scatter<T>(team: readonly T[], count: number): T[] {
  if (!team.length) return [];
  const tiles: T[] = [];
  for (let pass = 0; tiles.length < count; pass++) {
    const order = shuffled(team, pass * 2654435761 + team.length);
    if (order.length > 1 && order[0] === tiles[tiles.length - 1]) {
      order.push(order.shift()!);
    }
    tiles.push(...order);
  }
  return tiles.slice(0, count);
}
