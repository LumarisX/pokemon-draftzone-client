import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Params, RouterModule } from '@angular/router';

@Component({
  selector: 'pdz-flat-button',
  imports: [CommonModule, RouterModule],
  templateUrl: './flat-button.component.html',
  styleUrl: './flat-button.component.scss',
})
export class FlatButtonComponent {
  @Input() route: string | string[] = [];
  @Input() text: string = '';
  @Input() tooltip: string = '';
  @Input() ariaLabel: string = '';
  @Input() theme: 'menu' | 'primary' | 'secondary' = 'primary';
  @Input() href: string | null = null;
  @Input() newTab: BooleanInput = false;
  @Input() disabled: boolean = false;
  @Input() queryParams: Params | null | undefined;

  @Output() click = new EventEmitter<MouseEvent>();

  get effectiveAriaLabel(): string {
    return this.ariaLabel || this.tooltip;
  }
}
