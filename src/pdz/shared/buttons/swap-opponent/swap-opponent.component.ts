import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Output,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-swap-opponent',
  imports: [CommonModule, MatIconModule, ButtonComponent],
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
  readonly opponent = input<number | BooleanInput>();

  @Output()
  opponentChanged = new EventEmitter<number | boolean>();
  constructor() {}

  toggleOpponent() {
    const opponent = this.opponent();
    if (typeof opponent === 'number') {
      this.opponent = opponent === 1 ? 0 : 1;
    } else {
      this.opponent = !opponent;
    }
    this.onChange(opponent);
    this.onTouched();
    this.opponentChanged.emit(opponent);
  }

  private onTouched: () => void = () => {};
  private onChange: (value: number | BooleanInput) => void = () => {};

  writeValue(value: BooleanInput): void {
    this.opponent = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
