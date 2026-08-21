import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MenuItemComponent } from './menu-item.component';
import { MenuAlign, resolveMenuPlacement } from './menu-placement';
import { PDZ_MENU } from './menu.token';

export { MenuAlign };

let nextMenuId = 0;

const TYPEAHEAD_RESET = 700;

@Component({
  selector: 'pdz-menu',
  template: `
    <ng-content select="[pdz-menu-trigger]" />
    <div
      #panel
      popover="manual"
      class="pdz-menu__panel"
      role="menu"
      [id]="panelId"
      [attr.aria-label]="ariaLabel()"
      (keydown)="onPanelKeydown($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: PDZ_MENU, useExisting: forwardRef(() => MenuComponent) },
  ],
  host: {
    class: 'pdz-menu',
    '[class.pdz-menu--open]': 'isOpen()',
  },
})
export class MenuComponent {
  align = input<MenuAlign>('end');
  ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  readonly panelId = `pdz-menu-panel-${nextMenuId++}`;
  readonly isOpen = signal(false);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly projected = contentChildren(MenuItemComponent, {
    descendants: true,
  });
  private readonly items = computed(() =>
    this.projected().filter((item) => !item.disabled()),
  );

  private readonly document = inject(DOCUMENT);
  private trigger?: HTMLElement;
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const onPointerDown = (event: Event) => {
      if (!this.isOpen()) return;
      const target = event.target as Node;
      if (
        this.trigger?.contains(target) ||
        this.panel().nativeElement.contains(target)
      ) {
        return;
      }
      this.close(false);
    };
    const reposition = () => {
      if (this.isOpen()) this.position();
    };

    this.document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      clearTimeout(this.typeaheadTimer);
    });
  }

  registerTrigger(element: HTMLElement) {
    this.trigger = element;
  }

  toggle() {
    if (this.isOpen()) {
      this.close(true);
    } else {
      this.open('first');
    }
  }

  open(focus: 'first' | 'last' | 'none' = 'first') {
    if (this.isOpen()) return;
    this.isOpen.set(true);
    this.panel().nativeElement.showPopover();
    this.position();

    if (focus === 'none') return;
    queueMicrotask(() => {
      const items = this.items();
      const item = focus === 'first' ? items[0] : items[items.length - 1];
      item?.focus();
    });
  }

  close(restoreFocus = true) {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.panel().nativeElement.hidePopover();
    if (restoreFocus) this.trigger?.focus();
  }

  protected onPanelKeydown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    const key = keyEvent.key;

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.close(true);
        return;
      case 'Tab':
        this.close(false);
        return;
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.step(key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Home':
        event.preventDefault();
        this.items()[0]?.focus();
        return;
      case 'End': {
        event.preventDefault();
        const items = this.items();
        items[items.length - 1]?.focus();
        return;
      }
    }

    if (key.length === 1 && !keyEvent.metaKey && !keyEvent.ctrlKey) {
      this.search(key);
    }
  }

  private activeIndex() {
    const active = this.document.activeElement;
    return this.items().findIndex((item) => item.element === active);
  }

  private step(direction: number) {
    const items = this.items();
    if (!items.length) return;
    const from = this.activeIndex();
    const next =
      from < 0
        ? direction > 0
          ? 0
          : items.length - 1
        : (from + direction + items.length) % items.length;
    items[next].focus();
  }

  private search(key: string) {
    clearTimeout(this.typeaheadTimer);
    this.typeahead += key.toLowerCase();
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = '';
    }, TYPEAHEAD_RESET);

    const match = this.items().find((item) =>
      item.label.startsWith(this.typeahead),
    );
    match?.focus();
  }

  private position() {
    const trigger = this.trigger?.getBoundingClientRect();
    if (!trigger) return;

    const panel = this.panel().nativeElement;
    panel.style.maxHeight = '';

    const placement = resolveMenuPlacement(
      trigger,
      panel.getBoundingClientRect(),
      this.align(),
      { width: window.innerWidth, height: window.innerHeight },
    );

    panel.style.maxHeight = `${placement.maxHeight}px`;
    panel.style.left = `${placement.left}px`;
    panel.style.top = placement.top === null ? 'auto' : `${placement.top}px`;
    panel.style.bottom =
      placement.bottom === null ? 'auto' : `${placement.bottom}px`;
  }
}
