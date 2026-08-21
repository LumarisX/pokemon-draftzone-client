import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { PDZ_SEGMENTED } from './segmented.token';

@Component({
  selector: 'pdz-segmented-option',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedOptionComponent {
  value = input.required<unknown>();
  label = input.required<string>();
  icon = input<string>();
  trailingIcon = input<string>();
  disabled = input(false, { transform: booleanAttribute });

  readonly group = inject(PDZ_SEGMENTED, { optional: true });
}
