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
import { PDZ_MENU } from './menu.token';

export type MenuItemTone = 'default' | 'danger';

@Component({
  selector: 'button[pdz-menu-item], a[pdz-menu-item]',
  imports: [IconComponent],
  template: `
    @if (icon()) {
      <pdz-icon
        class="pdz-menu-item__icon"
        aria-hidden="true"
        [name]="icon()!"
        [size]="18"
      />
    }
    <span class="pdz-menu-item__label"><ng-content /></span>
  `,
  styleUrl: './menu-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-menu-item',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.data-tone]': 'tone()',
    '[attr.type]': 'isButton ? "button" : null',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '(click)': 'onClick($event)',
  },
})
export class MenuItemComponent {
  icon = input<string>();
  tone = input<MenuItemTone>('default');
  disabled = input(false, { transform: booleanAttribute });

  readonly element = inject(ElementRef<HTMLElement>)
    .nativeElement as HTMLElement;

  private readonly menu = inject(PDZ_MENU, { optional: true });
  protected readonly isButton = this.element.tagName === 'BUTTON';
  protected readonly nativeDisabled = computed(() =>
    this.isButton && this.disabled() ? '' : null,
  );

  get label() {
    const text = this.element.querySelector('.pdz-menu-item__label')
      ?.textContent;
    return text?.trim().toLowerCase() ?? '';
  }

  focus() {
    this.element.focus();
  }

  protected onClick(event: Event) {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.menu?.close(true);
  }
}
