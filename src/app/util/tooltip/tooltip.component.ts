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
  isHovered = false;
  showTooltip = false;
  tooltipPosition = { top: 0, left: 0 };

  @ContentChild('tooltipInfo') tooltipContent!: TemplateRef<any>;

  @ViewChild('tooltipContainer', { static: true })
  tooltipContainer!: ElementRef;
  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
    this.showTooltip = true;
    const rect = this.tooltipContainer.nativeElement.getBoundingClientRect();
    let top = rect.y - 8;
    let left = rect.x + rect.width / 2;
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
