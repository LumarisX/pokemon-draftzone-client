import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { PDZ_CHOICE_CARDS } from './choice-cards.token';

@Component({
  selector: 'pdz-choice-card',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceCardComponent<T = unknown> {
  value = input.required<T>();
  label = input.required<string>();
  description = input<string>();
  icon = input<string>();
  note = input<string | null>();
  disabled = input(false, { transform: booleanAttribute });

  readonly group = inject(PDZ_CHOICE_CARDS, { optional: true });
}
