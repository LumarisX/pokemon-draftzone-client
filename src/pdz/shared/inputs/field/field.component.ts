import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

@Component({
  selector: 'label[pdz-field]',
  template: `
    @if (label()) {
      <span class="pdz-field__label">
        {{ label() }}
        @if (required()) {
          <span class="pdz-field__required" aria-hidden="true">*</span>
        }
      </span>
    }

    <ng-content select=":not([pdz-error]):not([pdz-hint])" />
    <ng-content select="[pdz-error]" />
    <ng-content select="[pdz-hint]" />

    @if (error()) {
      <span class="pdz-field__error" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="pdz-field__hint">{{ hint() }}</span>
    }
  `,
  styleUrl: './field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-field',
    '[class.pdz-field--inline]': 'inline()',
    '[class.pdz-field--invalid]': '!!error()',
  },
})
export class FieldComponent {
  label = input<string>();
  hint = input<string>();
  error = input<string | null>();
  required = input(false, { transform: booleanAttribute });
  inline = input(false, { transform: booleanAttribute });
}
