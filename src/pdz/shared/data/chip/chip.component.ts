import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type ChipTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export type ChipVariant = 'soft' | 'solid' | 'outline';
export type ChipSize = 'xs' | 'sm' | 'md';

@Component({
  selector: 'pdz-chip',
  imports: [IconComponent, NgTemplateOutlet],
  template: `
    <ng-template #body>
      @if (icon(); as name) {
        <pdz-icon
          class="pdz-chip__icon"
          aria-hidden="true"
          [name]="name"
          [size]="iconSize()"
        />
      }
      <span class="pdz-chip__label"><ng-content /></span>
    </ng-template>

    @if (clickable()) {
      <button
        type="button"
        class="pdz-chip__action"
        [disabled]="disabled()"
        [attr.aria-label]="actionLabel()"
        [attr.aria-pressed]="pressed()"
        (click)="activated.emit()"
      >
        <ng-container [ngTemplateOutlet]="body" />
      </button>
    } @else {
      <span class="pdz-chip__action pdz-chip__action--static">
        <ng-container [ngTemplateOutlet]="body" />
      </span>
    }

    @if (removable()) {
      <button
        type="button"
        class="pdz-chip__remove"
        [disabled]="disabled()"
        [attr.aria-label]="removeLabel()"
        (click)="removed.emit()"
      >
        <pdz-icon name="close" aria-hidden="true" [size]="removeIconSize()" />
      </button>
    }
  `,
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-chip',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.pdz-chip--selected]': 'selected()',
    '[class.pdz-chip--disabled]': 'disabled()',
  },
})
export class ChipComponent {
  tone = input<ChipTone>('neutral');
  variant = input<ChipVariant>('soft');
  size = input<ChipSize>('md');
  icon = input<string>();

  clickable = input(false, { transform: booleanAttribute });
  actionLabel = input<string>();
  selected = input(false, { transform: booleanAttribute });
  removable = input(false, { transform: booleanAttribute });
  removeLabel = input('Remove');
  disabled = input(false, { transform: booleanAttribute });

  activated = output<void>();
  removed = output<void>();

  protected readonly pressed = computed(() =>
    this.clickable() && this.selected() ? true : null,
  );

  protected readonly iconSize = computed(
    () => ({ xs: 12, sm: 14, md: 16 })[this.size()],
  );
  protected readonly removeIconSize = computed(
    () => ({ xs: 10, sm: 12, md: 14 })[this.size()],
  );
}
