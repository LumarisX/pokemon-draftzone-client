import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementBadgeSize = 'sm' | 'md' | 'lg';

export const RARITY_ORDER: readonly AchievementRarity[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
];

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const ICON_SIZES: Record<AchievementBadgeSize, number> = {
  sm: 14,
  md: 20,
  lg: 28,
};

@Component({
  selector: 'pdz-achievement-badge',
  imports: [IconComponent, TooltipDirective],
  template: `
    <span class="pdz-achievement-badge__medal" [pdzTooltip]="tooltipText()">
      <pdz-icon [name]="locked() ? 'lock' : icon()" [size]="iconSize()" aria-hidden="true" />
    </span>
    @if (labelled()) {
      <span class="pdz-achievement-badge__text">
        <span class="pdz-achievement-badge__name">{{ name() }}</span>
        @if (rarityLabel(); as rarity) {
          <span class="pdz-achievement-badge__rarity">{{ rarity }}</span>
        }
      </span>
    }
  `,
  styleUrl: './achievement-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-achievement-badge',
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-size]': 'size()',
    '[attr.data-rarity]': 'rarity() ?? "locked"',
  },
})
export class AchievementBadgeComponent {
  readonly name = input.required<string>();
  readonly icon = input.required<string>();
  readonly rarity = input<AchievementRarity | null>(null);
  readonly size = input<AchievementBadgeSize>('md');
  readonly labelled = input(false, { transform: booleanAttribute });
  readonly tooltip = input(true, { transform: booleanAttribute });

  protected readonly locked = computed(() => this.rarity() === null);
  protected readonly iconSize = computed(() => ICON_SIZES[this.size()]);

  protected readonly rarityLabel = computed(() => {
    const rarity = this.rarity();
    return rarity ? RARITY_LABELS[rarity] : 'Locked';
  });

  protected readonly ariaLabel = computed(
    () => `${this.name()} (${this.rarityLabel()})`,
  );

  protected readonly tooltipText = computed(() =>
    this.labelled() || !this.tooltip() ? null : this.ariaLabel(),
  );
}
