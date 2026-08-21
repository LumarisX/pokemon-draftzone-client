import { Directive, ElementRef, inject } from '@angular/core';
import { PDZ_MENU } from './menu.token';

@Directive({
  selector: '[pdz-menu-trigger]',
  host: {
    class: 'pdz-menu-trigger',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'menu.isOpen()',
    '[attr.aria-controls]': 'menu.panelId',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MenuTriggerDirective {
  protected readonly menu = inject(PDZ_MENU);

  constructor() {
    this.menu.registerTrigger(
      inject(ElementRef<HTMLElement>).nativeElement as HTMLElement,
    );
  }

  protected onClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.menu.toggle();
  }

  protected onKeydown(event: Event) {
    const key = (event as KeyboardEvent).key;
    if (key !== 'ArrowDown' && key !== 'ArrowUp') return;
    event.preventDefault();
    event.stopPropagation();
    this.menu.open(key === 'ArrowDown' ? 'first' : 'last');
  }
}
