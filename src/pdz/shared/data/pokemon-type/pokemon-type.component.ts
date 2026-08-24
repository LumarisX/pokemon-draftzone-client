import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { typeColor, typeInk } from '@pdz/core/utils/styling';
import {
  IconComponent,
  IconSize,
} from '@pdz/shared/images/icon/icon.component';

export type PokemonTypeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PokemonTypeVariant = 'solid' | 'soft' | 'outline';
export type PokemonTypeContent = 'text' | 'icon' | 'both';
export type PokemonTypeDirection = 'horizontal' | 'vertical';

const ICON_SIZES: Readonly<
  Record<PokemonTypeSize, Record<PokemonTypeDirection, number>>
> = {
  xs: { horizontal: 10, vertical: 22 },
  sm: { horizontal: 12, vertical: 26 },
  md: { horizontal: 14, vertical: 30 },
  lg: { horizontal: 18, vertical: 36 },
  xl: { horizontal: 24, vertical: 44 },
};

const ICON_TYPES: ReadonlySet<string> = new Set([
  'bug',
  'dark',
  'dragon',
  'electric',
  'fairy',
  'fighting',
  'fire',
  'flying',
  'ghost',
  'grass',
  'ground',
  'ice',
  'normal',
  'poison',
  'psychic',
  'rock',
  'steel',
  'water',
]);

@Component({
  selector: 'pdz-pokemon-type',
  imports: [IconComponent],
  template: `
    @if (showIcon()) {
      <pdz-icon
        class="pdz-pokemon-type__icon"
        aria-hidden="true"
        [name]="iconName()!"
        [size]="resolvedIconSize()"
      />
    }
    @if (showLabel()) {
      <span class="pdz-pokemon-type__label">{{ type() }}</span>
    }
  `,
  styleUrl: './pokemon-type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-pokemon-type',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-direction]': 'direction()',
    '[class.pdz-pokemon-type--disabled]': 'disabled()',
    '[style.--pdz-pokemon-type-fill]': 'fill()',
    '[style.--pdz-pokemon-type-ink]': 'ink()',
    '[style.--pdz-pokemon-type-label-width]': 'labelWidth()',
    '[attr.role]': 'showLabel() ? null : "img"',
    '[attr.aria-label]': 'showLabel() ? null : type()',
  },
})
export class PokemonTypeComponent {
  readonly type = input.required<string>();
  readonly size = input<PokemonTypeSize>('md');
  readonly variant = input<PokemonTypeVariant>('solid');
  readonly content = input<PokemonTypeContent>('text');
  readonly direction = input<PokemonTypeDirection>('horizontal');
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Overrides the glyph size the `size`/`direction` pair would pick. */
  readonly iconSize = input<IconSize>();

  /**
   * The label holds a fixed width per size so a row of badges lines up. Pass a
   * length to widen it, or `auto` to let it shrink to the type name.
   */
  readonly labelWidth = input<string>();

  protected readonly iconName = computed(() => {
    const key = this.type().toLowerCase();
    return ICON_TYPES.has(key) ? `type-${key}` : null;
  });

  protected readonly showIcon = computed(
    () => this.content() !== 'text' && this.iconName() !== null,
  );

  protected readonly showLabel = computed(
    () => this.content() !== 'icon' || this.iconName() === null,
  );

  protected readonly resolvedIconSize = computed<IconSize>(
    () => this.iconSize() ?? ICON_SIZES[this.size()][this.direction()],
  );

  protected readonly fill = computed(() => typeColor(this.type()) ?? null);
  protected readonly ink = computed(() => typeInk(this.type()) ?? null);
}
