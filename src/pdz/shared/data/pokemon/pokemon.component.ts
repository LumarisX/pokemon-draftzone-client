import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { TYPES } from '@pdz/shared/data';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  SpriteComponent,
  SpriteSize,
  SpriteState,
} from '@pdz/shared/images/sprite/sprite.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

export type PokemonSize = 'inline' | 'row' | 'card' | 'hero';
export type PokemonAlign = 'start' | 'end';

type Captain = { icon: string; label: string; detail: string };

function captainTypes(types: readonly string[]): string {
  return types.length && types.length < TYPES.length ? types.join(', ') : 'any type';
}

const SPRITE_SIZES: Record<PokemonSize, SpriteSize> = {
  inline: 'sm',
  row: 'md',
  card: 'lg',
  hero: 'xl',
};

@Component({
  selector: 'pdz-pokemon',
  imports: [IconComponent, PokemonTypeComponent, SpriteComponent, TooltipDirective],
  template: `
    <pdz-sprite
      class="pdz-pokemon__sprite"
      [pokemon]="pokemon()"
      [size]="spriteSize()"
      [flipped]="align() === 'start'"
      [grounded]="grounded()"
      [state]="state()"
      [takenLogo]="takenLogo()"
      [takenBy]="takenBy()"
      [interactive]="interactive()"
      [tooltipPosition]="null"
    />
    <span class="pdz-pokemon__text">
      <span
        class="pdz-pokemon__title"
        [attr.role]="headingLevel() ? 'heading' : null"
        [attr.aria-level]="headingLevel()"
      >
        <span class="pdz-pokemon__name">{{ pokemon().name }}</span>
        @for (captain of captains(); track captain.icon) {
          <pdz-icon
            class="pdz-pokemon__captain"
            [name]="captain.icon"
            [ariaLabel]="captain.label"
            [pdzTooltip]="captain.detail"
            [size]="captainSize()"
          />
        }
        <ng-content select="[pdz-pokemon-badge]" />
      </span>
      @if (hasDetail()) {
        <span class="pdz-pokemon__detail">
          @if (tier(); as tier) {
            <span>{{ tier }}</span>
          }
          @if (cost() !== null && cost() !== undefined) {
            <span class="pdz-pokemon__cost"
              >{{ cost() }}<span class="pdz-pokemon__unit"> pts</span></span
            >
          }
          @if (types().length) {
            <span class="pdz-pokemon__types">
              @for (type of types(); track type) {
                <pdz-pokemon-type
                  [type]="type"
                  [content]="size() === 'hero' ? 'text' : 'icon'"
                  [size]="size() === 'hero' ? 'sm' : 'xs'"
                />
              }
            </span>
          }
        </span>
      }
      <ng-content select="[pdz-pokemon-meta]" />
    </span>
  `,
  styleUrl: './pokemon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-pokemon',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
    '[attr.data-state]': 'state()',
  },
})
export class PokemonComponent {
  readonly pokemon = input.required<Pokemon<DraftOptions>>();
  readonly size = input<PokemonSize>('row');
  readonly align = input<PokemonAlign>('start');
  readonly tier = input<string | null | undefined>();
  readonly cost = input<number | string | null | undefined>();
  readonly types = input<readonly string[]>([]);
  readonly state = input<SpriteState | null>(null);
  readonly takenLogo = input<string | null | undefined>();
  readonly takenBy = input('');
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly headingLevel = input<2 | 3 | 4 | null>(null);

  protected readonly spriteSize = computed(() => SPRITE_SIZES[this.size()]);

  protected readonly grounded = computed(
    () => this.size() === 'card' || this.size() === 'hero',
  );

  protected readonly captainSize = computed(() =>
    this.size() === 'hero' ? 18 : 14,
  );

  protected readonly hasDetail = computed(
    () =>
      this.size() !== 'inline' &&
      (!!this.tier() ||
        (this.cost() !== null && this.cost() !== undefined) ||
        this.types().length > 0),
  );

  protected readonly captains = computed<Captain[]>(() => {
    const capt = this.pokemon().capt;
    if (!capt) return [];
    const captains: Captain[] = [];
    if (capt.tera) {
      captains.push({
        icon: 'tera',
        label: 'Tera captain',
        detail: `Tera captain: ${captainTypes(capt.tera)}`,
      });
    }
    if (capt.z) {
      captains.push({
        icon: 'z',
        label: 'Z-move captain',
        detail: `Z-move captain: ${captainTypes(capt.z)}`,
      });
    }
    if (capt.dmax) {
      captains.push({ icon: 'dmax', label: 'Dynamax captain', detail: 'Dynamax captain' });
    }
    return captains;
  });
}
