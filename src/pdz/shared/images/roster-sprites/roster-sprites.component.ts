import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

export type RosterSpritesLayout = 'wrap' | 'tiers';

export type RosterSpritesTone = 'team1' | 'team2';

type RosterSlot = Pokemon<DraftOptions> | null;

type RosterTier = { slots: RosterSlot[]; scale: number };

export const TIER_STEP = 1.4;

export function tierSplit(count: number): number {
  const imbalance = (top: number) => Math.abs(top * TIER_STEP - (count - top));
  let top = 1;
  for (let candidate = 2; candidate * 2 < count; candidate++) {
    if (imbalance(candidate) < imbalance(top)) top = candidate;
  }
  return top;
}

@Component({
  selector: 'pdz-roster-sprites',
  imports: [SpriteComponent],
  template: `
    @if (layout() === 'tiers') {
      @for (tier of tiers(); track $index) {
        <div
          class="pdz-roster-sprites__tier"
          [style.--pdz-roster-scale]="tier.scale"
          [style.--pdz-roster-count]="tier.slots.length"
        >
          @for (slot of tier.slots; track $index) {
            <div class="pdz-roster-sprites__slot">
              @if (slot; as pokemon) {
                <pdz-sprite
                  [pokemon]="pokemon"
                  size="fill"
                  tooltipPosition="above"
                  [showFormes]="false"
                />
              } @else {
                <span class="pdz-roster-sprites__spot" aria-hidden="true"></span>
              }
            </div>
          }
        </div>
      }
    } @else {
      @for (slot of slots(); track $index) {
        @if (slot; as pokemon) {
          <pdz-sprite [pokemon]="pokemon" [showFormes]="false" />
        } @else {
          <span class="pdz-roster-sprites__spot" aria-hidden="true"></span>
        }
      }
    }
  `,
  styleUrl: './roster-sprites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-roster-sprites',
    role: 'img',
    '[attr.data-layout]': 'layout()',
    '[attr.data-tone]': 'tone()',
    '[attr.aria-label]': 'label()',
    '[style.--pdz-roster-span]': 'frame().span',
    '[style.--pdz-roster-depth]': 'frame().depth',
  },
})
export class RosterSpritesComponent {
  readonly pokemon = input.required<Pokemon<DraftOptions>[]>();
  readonly layout = input<RosterSpritesLayout>('wrap');
  readonly spots = input(0);
  readonly name = input('');
  readonly tone = input<RosterSpritesTone>('team1');

  protected readonly slots = computed<RosterSlot[]>(() => {
    const team = this.pokemon();
    const count = Math.max(this.spots(), team.length);
    return Array.from({ length: count }, (_, index) => team[index] ?? null);
  });

  protected readonly tiers = computed<RosterTier[]>(() => {
    const slots = this.slots();
    if (slots.length < 2) return [{ slots, scale: 1 }];
    const top = tierSplit(slots.length);
    return [
      { slots: slots.slice(0, top), scale: TIER_STEP },
      { slots: slots.slice(top), scale: 1 },
    ];
  });

  protected readonly frame = computed(() => {
    const tiers = this.tiers();
    return {
      span: Math.max(1, ...tiers.map((tier) => tier.slots.length * tier.scale)),
      depth: tiers.reduce((sum, tier) => sum + tier.scale, 0),
    };
  });

  protected readonly label = computed(() => {
    const names = this.pokemon()
      .map((pokemon) => pokemon.name)
      .join(', ');
    return this.name() ? `${this.name()}: ${names}` : names;
  });
}
