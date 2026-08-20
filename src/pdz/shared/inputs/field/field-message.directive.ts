import { Directive, ElementRef, inject } from '@angular/core';

let nextMessageId = 0;

@Directive()
export abstract class FieldMessageDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly messageId =
    this.element.nativeElement.id || `pdz-field-message-${nextMessageId++}`;
}

@Directive({
  selector: '[pdz-error]',
  host: {
    '[id]': 'messageId',
    role: 'alert',
  },
})
export class FieldErrorDirective extends FieldMessageDirective {}

@Directive({
  selector: '[pdz-hint]',
  host: {
    '[id]': 'messageId',
  },
})
export class FieldHintDirective extends FieldMessageDirective {}
