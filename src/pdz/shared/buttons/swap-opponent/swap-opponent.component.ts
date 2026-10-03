import { BooleanInput } from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

@Component({
  selector: 'pdz-swap-opponent',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './swap-opponent.component.html',
  styleUrl: './swap-opponent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly opponentChanged = output<number | boolean>();

  protected readonly showingOpponent = computed(() => !!this.opponent());

  private onTouched: () => void = () => {};
  private onChange: (value: number | boolean) => void = () => {};

  toggleOpponent() {
    const current = this.opponent();
    const next =
      typeof current === 'number' ? (current === 1 ? 0 : 1) : !current;
    this.opponent.set(next);
    this.onChange(next);
    this.onTouched();
    this.opponentChanged.emit(next);
  }

  writeValue(value: BooleanInput): void {
    this.opponent.set(value);
  }

  registerOnChange(fn: (value: number | boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
