import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  TemplateRef,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
  imports: [CommonModule],
})
export class TooltipComponent {
  @ContentChild('tooltipInfo') tooltipContent!: TemplateRef<any>;
  @ViewChild('tooltipContainer', { static: true })
  tooltipContainer!: ElementRef;
  tooltipContext!: ElementRef;

  isHovered = false;
  showTooltip = false;
  tooltipPosition = { top: 0, left: 0 };

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
    this.showTooltip = true;
    const rect = this.tooltipContainer.nativeElement.getBoundingClientRect();
    const tooltipWidth = 200;
    const tooltipHeight = 40;
    let top = rect.top - tooltipHeight - 10;
    let left = rect.left + rect.width / 2;
    if (top < 0) {
      top = rect.bottom + 10;
    }
    if (left - tooltipWidth / 2 < 0) {
      left = tooltipWidth / 2;
    }
    if (left + tooltipWidth / 2 > window.innerWidth) {
      left = window.innerWidth - tooltipWidth / 2;
    }
    this.tooltipPosition = { top, left };
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isHovered = false;
    setTimeout(() => {
      if (!this.isHovered) {
        this.showTooltip = false;
      }
    }, 300);
  }
}
