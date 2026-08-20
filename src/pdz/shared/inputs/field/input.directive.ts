import { Directive, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { FieldComponent } from './field.component';

@Directive({
  selector: 'input[pdz-input], select[pdz-input], textarea[pdz-input]',
  host: {
    class: 'pdz-input',
    '[class.pdz-input--invalid]': 'showInvalid',
    '[attr.aria-invalid]': 'showInvalid ? true : null',
    '[attr.aria-labelledby]': 'field?.ariaLabelledBy() ?? null',
    '[attr.aria-describedby]': 'field?.ariaDescribedBy() ?? null',
    '[attr.data-size]': 'size()',
  },
})
export class InputDirective {
  private readonly control = inject(NgControl, {
    optional: true,
    self: true,
  });

  protected readonly field = inject(FieldComponent, { optional: true });

  size = input<'sm' | 'md'>('md');
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
