import {
  Component,
  computed,
  EventEmitter,
  forwardRef,
  Output,
  signal,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'pdz-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
})
export class SliderComponent implements ControlValueAccessor {
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly color = input<string>();
  readonly showValue = input(false);

  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  @Output() valueChange = new EventEmitter<number>();

  value = 0;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  get fillPercent(): number {
    const range = this.max() - this.min();
    if (range <= 0) return 0;
    const clamped = Math.min(Math.max(this.value, this.min()), this.max());
    return ((clamped - this.min()) / range) * 100;
  }

  writeValue(value: number): void {
    this.value = value ?? this.min();
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
