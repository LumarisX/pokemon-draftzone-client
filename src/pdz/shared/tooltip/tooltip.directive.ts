import { Directive, ElementRef, HostListener, input } from '@angular/core';
import { TooltipService } from './tooltip.service';

@Directive({
  selector: 'pdz-[pdzTooltip]',
})
export class TooltipDirective {
  readonly content = input<string | null>(null, { alias: 'pdzTooltip' });

  constructor(
    private el: ElementRef,
    private tooltipService: TooltipService,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = rect.top;
    const content = this.content();
    if (content) {
      this.tooltipService.show(content, left, top);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.tooltipService.hide();
  }
}
