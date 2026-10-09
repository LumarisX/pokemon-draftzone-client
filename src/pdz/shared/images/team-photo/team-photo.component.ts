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
export type TeamPhotoSide = 'team1' | 'team2';

type SlotPlace = {
  offset: number;
  row: number;
};

type PhotoSlot = SlotPlace & { pokemon: Pokemon<DraftOptions> | null };

export const TEAM_PHOTO_SIZE = 14;

const ROWS: Readonly<Record<number, readonly number[]>> = {
  1: [1],
  2: [2],
  3: [3],
  4: [4],
  5: [4, 1],
  6: [4, 2],
  7: [4, 3],
  8: [5, 2, 1],
  9: [5, 4],
  10: [5, 4, 1],
  11: [5, 4, 2],
  12: [5, 4, 3],
  13: [5, 4, 4],
  14: [5, 4, 5],
};

function rowOffsets(count: number, halfSteps: boolean): number[] {
  const offsets: number[] = [];
  if (halfSteps) {
    for (let i = 0; i < Math.floor(count / 2); i++) {
      offsets.push(-(i + 0.5), i + 0.5);
    }
    return offsets;
  }
  if (count % 2) offsets.push(0);
  for (let i = 1; offsets.length < count; i++) {
    offsets.push(-i, i);
  }
  return offsets;
}

function arrange(count: number): SlotPlace[] {
  const rows = ROWS[count] ?? [];
  let halfSteps = rows[0] % 2 === 0;
  return rows.flatMap((size, row) => {
    const places = rowOffsets(size, halfSteps).map((offset) => ({
      offset,
      row,
    }));
    halfSteps = !halfSteps;
    return places;
  });
}

@Component({
  selector: 'pdz-team-photo',
  imports: [SpriteComponent],
  template: `
    @for (slot of slots(); track $index) {
      <div
        class="pdz-team-photo__slot"
        [attr.data-row]="slot.row"
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
    '[attr.data-side]': 'side()',    '[attr.data-kind]': 'kind()',
    '[attr.aria-label]': 'label()',
    '[attr.data-rows]': 'frame().rows',
    '[style.--pdz-team-photo-reach]': 'frame().reach',
  },
})
export class TeamPhotoComponent {
  protected readonly kind = inject(SpriteService).kind;

  readonly pokemon = input.required<Pokemon<DraftOptions>[]>();
  readonly spots = input(0);
  readonly size = input<TeamPhotoSize>('md');
  readonly side = input<TeamPhotoSide>('team1');  readonly name = input('');

  private readonly shown = computed(() =>
    this.pokemon().slice(0, TEAM_PHOTO_SIZE),
  );

  protected readonly slots = computed<PhotoSlot[]>(() => {
    const team = this.shown();
    const count = Math.min(
      Math.max(this.spots(), team.length),
      TEAM_PHOTO_SIZE,
    );
    return arrange(count).map((place, index) => ({
      ...place,
      pokemon: team[index] ?? null,
    }));
  });

  protected readonly frame = computed(() => {
    const slots = this.slots();
    return {
      rows: (slots.at(-1)?.row ?? 0) + 1,
      reach: Math.max(0, ...slots.map((slot) => Math.abs(slot.offset))),
    };
  });

  protected readonly label = computed(() => {
    const names = this.shown()
      .map((pokemon) => pokemon.name)
      .join(', ');
    return this.name() ? `${this.name()}: ${names}` : names;
  });
}
