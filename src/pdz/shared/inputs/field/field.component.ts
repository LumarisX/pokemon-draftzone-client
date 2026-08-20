import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
} from '@angular/core';
import {
  FieldErrorDirective,
  FieldHintDirective,
} from './field-message.directive';

let nextFieldId = 0;

@Component({
  selector: 'label[pdz-field], div[pdz-field]',
  template: `
    @if (label()) {
      <span class="pdz-field__label" [id]="labelId">
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
      <span class="pdz-field__error" [id]="messageId" role="alert">{{
        error()
      }}</span>
    } @else if (hint()) {
      <span class="pdz-field__hint" [id]="messageId">{{ hint() }}</span>
    }
  `,
  styleUrl: './field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-field',
    '[class.pdz-field--inline]': 'inline()',
    '[class.pdz-field--invalid]': '!!error()',
    '[attr.role]': 'isLabel ? null : "group"',
    '[attr.aria-labelledby]': 'isLabel ? null : ariaLabelledBy()',
  },
})
export class FieldComponent {
  label = input<string>();
  hint = input<string>();
  error = input<string | null>();
  required = input(false, { transform: booleanAttribute });
  inline = input(false, { transform: booleanAttribute });

  private readonly projectedErrors = contentChildren(FieldErrorDirective, {
    descendants: true,
  });
  private readonly projectedHints = contentChildren(FieldHintDirective, {
    descendants: true,
  });

  protected readonly isLabel =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName ===
    'LABEL';

  private readonly uid = nextFieldId++;

  readonly labelId = `pdz-field-label-${this.uid}`;
  protected readonly messageId = `pdz-field-message-${this.uid}`;

  readonly ariaLabelledBy = computed(() =>
    this.label() ? this.labelId : null,
  );

  readonly ariaDescribedBy = computed(() => {
    const ids = [
      ...this.projectedErrors().map((message) => message.messageId),
      ...this.projectedHints().map((message) => message.messageId),
    ];
    if (this.error() || this.hint()) {
      ids.push(this.messageId);
    }
    return ids.length ? ids.join(' ') : null;
  });
}
