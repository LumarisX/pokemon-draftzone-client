import { Directive, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[pdz-checkbox], input[pdz-radio]',
  host: {
    class: 'pdz-choice',
    '[class.pdz-choice--invalid]': 'showInvalid',
    '[attr.aria-invalid]': 'showInvalid ? true : null',
    '[attr.type]': 'type()',
  },
})
export class ChoiceDirective {
  private readonly control = inject(NgControl, {
    optional: true,
    self: true,
  });

  type = input<string>('checkbox');
  invalid = input<boolean | null>(null);

  protected get showInvalid(): boolean {
    const forced = this.invalid();
    if (forced !== null) {
      return forced;
    }
    const c = this.control?.control;
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
