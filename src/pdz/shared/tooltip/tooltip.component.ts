import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
} from '@angular/core';
import { TooltipRequest, TooltipService } from './tooltip.service';
import { resolvePlacement } from './tooltip-placement';

export const TOOLTIP_ID = 'pdz-tooltip';

const OPEN_CLASS = 'pdz-tooltip--open';
const MEASURING_CLASS = 'pdz-tooltip--measuring';

@Component({
  selector: 'pdz-tooltip',
  template: `{{ service.visible()?.content }}`,
  styleUrl: './tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-tooltip',
    id: TOOLTIP_ID,
    role: 'tooltip',
    popover: 'manual',
  },
})
export class TooltipComponent {
  protected readonly service = inject(TooltipService);

  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    afterRenderEffect(() => {
      const request = this.service.visible();
      if (request) {
        this.present(request);
      } else {
        this.conceal();
      }
    });
  }

  private present(request: TooltipRequest) {
    const element = this.element.nativeElement;
    const view = element.ownerDocument.defaultView;
    if (!view) return;

    element.classList.add(MEASURING_CLASS, OPEN_CLASS);
    this.raise(element);

    const placement = resolvePlacement(
      request.anchor.getBoundingClientRect(),
      { width: element.offsetWidth, height: element.offsetHeight },
      request.position,
      { width: view.innerWidth, height: view.innerHeight },
    );

    element.style.left = `${placement.left}px`;
    element.style.top = `${placement.top}px`;
    element.dataset['side'] = placement.side;
    element.classList.remove(MEASURING_CLASS);
  }

  private conceal() {
    const element = this.element.nativeElement;
    this.lower(element);
    element.classList.remove(OPEN_CLASS, MEASURING_CLASS);
  }

  private raise(element: HTMLElement) {
    if (typeof element.showPopover !== 'function') return;
    try {
      if (element.matches(':popover-open')) element.hidePopover();
      element.showPopover();
    } catch {
      /* empty */
    }
  }

  private lower(element: HTMLElement) {
    if (typeof element.hidePopover !== 'function') return;
    try {
      if (element.matches(':popover-open')) element.hidePopover();
    } catch {
      /* empty */
    }
  }
}
