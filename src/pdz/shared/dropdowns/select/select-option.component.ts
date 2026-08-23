import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import { PDZ_SELECT } from './select.token';
import { inject } from '@angular/core';

@Component({
  selector: 'pdz-option',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOptionComponent {
  readonly owner = inject(PDZ_SELECT, { optional: true });

  value = input.required<unknown>();
  label = input.required<string>();
  description = input<string>();
  iconUrl = input<string>();
  disabled = input(false, { transform: booleanAttribute });
  group = input<string>();
}
