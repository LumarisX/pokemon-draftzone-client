import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'swap-opponent',
  imports: [CommonModule, MatIconModule, MatButtonModule],
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
  @Input()
  opponent: number | BooleanInput;

  @Output()
  opponentChanged = new EventEmitter<number | boolean>();
  constructor() {}

  toggleOpponent() {
    if (typeof this.opponent === 'number') {
      this.opponent = this.opponent === 1 ? 0 : 1;
    } else {
      this.opponent = !this.opponent;
    }
    this.onChange(this.opponent);
    this.onTouched();
    this.opponentChanged.emit(this.opponent);
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
