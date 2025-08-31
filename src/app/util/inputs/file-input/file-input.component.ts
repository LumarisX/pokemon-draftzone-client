import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, Input, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';

class MyTel {
  constructor(
    public area: string,
    public exchange: string,
    public subscriber: string,
  ) {}
}

@Component({
  selector: 'example-tel-input',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [{ provide: MatFormFieldControl, useExisting: MyTelInput }],
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.scss',
})
export class MyTelInput
  implements MatFormFieldControl<MyTel>, ControlValueAccessor
{
  private _elementRef = inject(ElementRef);
  ngControl = inject(NgControl, { optional: true, self: true });

  parts: FormGroup;

  @Input()
  get value(): MyTel | null {
    let n = this.parts.value;
    if (
      n.area.length == 3 &&
      n.exchange.length == 3 &&
      n.subscriber.length == 4
    ) {
      return new MyTel(n.area, n.exchange, n.subscriber);
    }
    return null;
  }
  set value(tel: MyTel | null) {
    tel = tel || new MyTel('', '', '');
    this.parts.setValue({
      area: tel.area,
      exchange: tel.exchange,
      subscriber: tel.subscriber,
    });
    this.stateChanges.next();
  }

  onFileSelected(event: Event) {
    console.log(event);
  }

  constructor() {
    const fb = inject(FormBuilder);

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.parts = fb.group({
      area: '',
      exchange: '',
      subscriber: '',
    });
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(tel: MyTel | null): void {
    this.value = tel;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  stateChanges = new Subject<void>();

  ngOnDestroy() {
    this.stateChanges.complete();
  }
  static nextId = 0;

  @HostBinding() id = `example-tel-input-${MyTelInput.nextId++}`;
  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }
  private _placeholder: string = '';
  focused = false;

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  touched = false;

  onFocusOut(event: FocusEvent) {
    if (
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  get empty() {
    let n = this.parts.value;
    return !n.area && !n.exchange && !n.subscriber;
  }
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }
  @Input()
  get required() {
    return this._required;
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;
  get errorState(): boolean {
    return this.parts.invalid && this.touched;
  }
  controlType = 'example-tel-input';

  autofilled?: boolean | undefined;
  @Input('aria-describedby') userAriaDescribedBy?: string;
  disableAutomaticLabeling?: boolean | undefined;
  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement;

    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }
  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != 'input') {
      this._elementRef.nativeElement.querySelector('input').focus();
    }
  }
}
