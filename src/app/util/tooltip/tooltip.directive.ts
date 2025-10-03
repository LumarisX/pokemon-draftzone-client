import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { TooltipService } from './tooltip.service';

@Directive({
  selector: '[pdzTooltip]',
  standalone: false,
})
export class TooltipDirective {
  @Input('pdzTooltip') content: string | null = null;

  constructor(
    private el: ElementRef,
    private tooltipService: TooltipService,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = rect.top;
    if (this.content) {
      this.tooltipService.show(this.content, left, top);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.tooltipService.hide();
  }
}
