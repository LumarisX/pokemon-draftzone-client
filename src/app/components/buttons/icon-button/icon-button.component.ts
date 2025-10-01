import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Params, RouterModule } from '@angular/router';

@Component({
  selector: 'pdz-icon-button',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  @Input() route: string | string[] = [];
  @Input({ required: true }) icon!: string;
  @Input() tooltip: string = '';
  @Input() ariaLabel: string = '';
  @Input() theme: 'menu' | 'primary' | 'secondary' | null = null;
  @Input() href: string | null = null;
  @Input() newTab: BooleanInput = false;
  @Input() disabled: boolean = false;
  @Input() queryParams: Params | null | undefined;

  get effectiveAriaLabel(): string {
    return this.ariaLabel || this.tooltip;
  }
}
