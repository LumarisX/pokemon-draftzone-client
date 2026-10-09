import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { SpriteService } from '@pdz/core/services/sprite.service';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

export type TeamPhotoSize = 'md' | 'lg';

type PhotoSlot = {
  offset: number;
  back: boolean;
  pokemon: Pokemon<DraftOptions> | null;
};

const SLOTS: readonly Omit<PhotoSlot, 'pokemon'>[] = [
  { offset: -0.5, back: false },
  { offset: 0.5, back: false },
  { offset: -1.5, back: false },
  { offset: 1.5, back: false },
  { offset: -1, back: true },
  { offset: 1, back: true },
];

@Component({
  selector: 'pdz-team-photo',
  imports: [SpriteComponent],
  template: `
    @for (slot of slots(); track $index) {
      <div
        class="pdz-team-photo__slot"
        [class.pdz-team-photo__slot--back]="slot.back"
        [style.--pdz-team-photo-offset]="slot.offset"
      >
        @if (slot.pokemon; as pokemon) {
          <pdz-sprite
            [pokemon]="pokemon"
            size="100%"
            grounded
            tooltipPosition="above"
            [interactive]="false"
            [showFormes]="false"
          />
        } @else {
          <span class="pdz-team-photo__spot" aria-hidden="true"></span>
        }
      </div>
    }
  `,
  styleUrl: './team-photo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-team-photo',
    role: 'img',
    '[attr.data-size]': 'size()',
    '[attr.data-kind]': 'kind()',
    '[attr.aria-label]': 'label()',
  },
})
export class TeamPhotoComponent {
  protected readonly kind = inject(SpriteService).kind;

  readonly pokemon = input.required<Pokemon<DraftOptions>[]>();
  readonly spots = input(0);
  readonly size = input<TeamPhotoSize>('md');
  readonly name = input('');

  protected readonly slots = computed<PhotoSlot[]>(() => {
    const team = this.pokemon().slice(0, SLOTS.length);
    const count = Math.min(Math.max(this.spots(), team.length), SLOTS.length);
    return SLOTS.slice(0, count).map((slot, index) => ({
      ...slot,
      pokemon: team[index] ?? null,
    }));
  });

  protected readonly label = computed(() => {
    const names = this.pokemon()
      .slice(0, SLOTS.length)
      .map((pokemon) => pokemon.name)
      .join(', ');
    return this.name() ? `${this.name()}: ${names}` : names;
  });
}
