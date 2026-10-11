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
          size="100%"
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

  protected readonly tiles = computed(() => {
    const team = this.pokemon();
    if (!team.length) return [];
    return Array.from(
      { length: this.count() },
      (_, index) => team[index % team.length],
    );
  });
}
