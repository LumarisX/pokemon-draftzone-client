import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'link';
export type ButtonColor = 'primary' | 'secondary' | 'neutral' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'button[pdz-button], a[pdz-button], label[pdz-button]',
  imports: [IconComponent],
  template: `
    @if (loading()) {
      <span class="pdz-btn__spinner" aria-hidden="true"></span>
    }
    <span class="pdz-btn__content">
      @if (icon()) {
        <pdz-icon aria-hidden="true" [name]="icon()!" [size]="iconSize()" />
      }
      <ng-content />
    </span>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-btn',
    '[attr.data-variant]': 'variant()',
    '[attr.data-color]': 'color()',
    '[attr.data-size]': 'size()',
    '[class.pdz-btn--icon]': 'iconOnly()',
    '[class.pdz-btn--loading]': 'loading()',
    '[class.pdz-btn--block]': 'block()',
    '[class.pdz-btn--pill]': 'pill()',
    '[attr.type]': 'isButton ? type() : null',
    '[attr.aria-busy]': 'loading() ? true : null',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'inert() ? true : null',
    '[attr.tabindex]': 'inert() && !isButton ? -1 : null',
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant>('filled');
  color = input<ButtonColor>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false, { transform: booleanAttribute });
  iconOnly = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  block = input(false, { transform: booleanAttribute });
  pill = input(false, { transform: booleanAttribute });
  type = input<ButtonType>('button');
  icon = input<string>();

  protected iconSize = computed(
    () => ({ sm: 16, md: 18, lg: 20 })[this.size()],
  );

  protected readonly isButton =
    inject(ElementRef).nativeElement.tagName === 'BUTTON';

  protected inert = computed(() => this.disabled() || this.loading());
  protected nativeDisabled = computed(() =>
    this.isButton && this.inert() ? '' : null,
  );
}
