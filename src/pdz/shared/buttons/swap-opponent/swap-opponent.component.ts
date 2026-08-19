import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Output,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-swap-opponent',
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './swap-opponent.component.html',
  styleUrl: './swap-opponent.component.scss',

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwapOpponentButton),
      multi: true,
    },
  ],
})
export class SwapOpponentButton implements ControlValueAccessor {
  readonly opponent = model<number | BooleanInput>();

  @Output()
  opponentChanged = new EventEmitter<number | boolean>();
  constructor() {}

  toggleOpponent() {
    const current = this.opponent();
    const next =
      typeof current === 'number' ? (current === 1 ? 0 : 1) : !current;
    this.opponent.set(next);
    this.onChange(next);
    this.onTouched();
    this.opponentChanged.emit(next);
  }

  private onTouched: () => void = () => {};
  private onChange: (value: number | BooleanInput) => void = () => {};

  writeValue(value: BooleanInput): void {
    this.opponent.set(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
