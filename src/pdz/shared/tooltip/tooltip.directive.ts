import {
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { TooltipPosition } from './tooltip-placement';
import { TOOLTIP_ID } from './tooltip.component';
import { TooltipService } from './tooltip.service';

@Directive({
  selector: '[pdzTooltip]',
  host: {
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onLeave()',
    '(pointerdown)': 'onLeave()',
    '(focus)': 'onFocus()',
    '(blur)': 'onLeave()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class TooltipDirective {
  readonly content = input<string | null | undefined>(null, {
    alias: 'pdzTooltip',
  });
  readonly position = input<TooltipPosition | null | undefined>('above', {
    alias: 'pdzTooltipPosition',
  });
  readonly disabled = input(false, {
    alias: 'pdzTooltipDisabled',
    transform: booleanAttribute,
  });

  private readonly service = inject(TooltipService);
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly ownDescribedBy =
    this.element.nativeElement.getAttribute('aria-describedby');

  protected readonly describedBy = computed(() => {
    if (!this.service.isAnchor(this.element.nativeElement)) {
      return this.ownDescribedBy;
    }
    return this.ownDescribedBy
      ? `${this.ownDescribedBy} ${TOOLTIP_ID}`
      : TOOLTIP_ID;
  });

  protected onPointerEnter() {
    this.open();
  }

  protected onFocus() {
    if (this.element.nativeElement.matches(':focus-visible')) this.open();
  }

  protected onLeave() {
    this.service.hide(this.element.nativeElement);
  }

  private open() {
    const content = this.content()?.trim();
    if (!content || this.disabled()) return;
    this.service.show(
      this.element.nativeElement,
      content,
      this.position() ?? 'above',
    );
  }
}
