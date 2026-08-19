import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

const ICON_SIZES: Record<EmptyStateSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

@Component({
  selector: 'pdz-empty-state',
  imports: [IconComponent],
  template: `
    @if (icon()) {
      <pdz-icon
        class="pdz-empty-state__icon"
        aria-hidden="true"
        [name]="icon()!"
        [size]="iconSize()"
      />
    }
    @if (heading()) {
      <p class="pdz-empty-state__heading">{{ heading() }}</p>
    }
    @if (message()) {
      <p class="pdz-empty-state__message">{{ message() }}</p>
    }
    <ng-content />
    <div class="pdz-empty-state__actions"><ng-content select="[pdz-empty-state-actions]" /></div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-empty-state',
    '[attr.data-size]': 'size()',
    '[class.pdz-empty-state--bordered]': 'bordered()',
  },
})
export class EmptyStateComponent {
  icon = input<string>();
  heading = input<string>();
  message = input<string>();
  size = input<EmptyStateSize>('md');
  bordered = input(false, { transform: booleanAttribute });

  protected iconSize = computed(() => ICON_SIZES[this.size()]);
}
