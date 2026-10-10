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

const ROW_CAPACITY = [6, 7, 6] as const;

export const TEAM_PHOTO_SIZE = ROW_CAPACITY.reduce((sum, size) => sum + size, 0);

function rowSizes(count: number): number[] {
  const sizes: number[] = [];
  let left = count;
  for (const capacity of ROW_CAPACITY) {
    if (left <= 0) break;
    const size = Math.min(capacity, left);
    sizes.push(size);
    left -= size;
  }
  return sizes;
}

function rowOffsets(count: number, halfSteps: boolean): number[] {
  const offsets: number[] = halfSteps ? [] : [0];
  for (let i = halfSteps ? 0.5 : 1; offsets.length < count; i++) {
    offsets.push(-i, i);
  }
  return offsets.slice(0, count);
}

function arrange(count: number): SlotPlace[] {
  const rows = rowSizes(count);
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
