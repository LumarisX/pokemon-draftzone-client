import {
  booleanAttribute,
  Component,
  computed,
  EventEmitter,
  forwardRef,
  Output,
  signal,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const PAGE_STEP = 5;

export type SliderTickTone = 'neutral' | 'good' | 'bad';

export interface SliderTick {
  readonly position: number;
  readonly tone: SliderTickTone;
}

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
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly color = input<string>();
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly ticks = input(false, { transform: booleanAttribute });
  readonly tickTones = input<readonly SliderTickTone[]>();
  readonly snapValues = input<readonly number[]>();
  readonly maxTicks = input(96);

  readonly effectiveStep = computed(() => {
    const stops = this.snapValues();
    return stops && stops.length > 0 ? 1 : this.step();
  });

  readonly tickMarks = computed<SliderTick[]>(() => {
    const tones = this.tickTones();
    const snap = this.snapValues();
    const span = this.max() - this.min();
    if (span <= 0) return [];

    if (snap && snap.length > 0) {
      if (snap.length > this.maxTicks()) return [];
      return snap.map((value, index) => ({
        position: ((value - this.min()) / span) * 100,
        tone: tones?.[index] ?? 'neutral',
      }));
    }

    if (!this.ticks() && !tones) return [];

    const step = this.step();
    if (step <= 0) return [];
    const count = Math.floor(span / step) + 1;
    if (count < 2 || count > this.maxTicks()) return [];

    return Array.from({ length: count }, (_, index) => ({
      position: (index / (count - 1)) * 100,
      tone: tones?.[index] ?? 'neutral',
    }));
  });

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
    const target = event.target as HTMLInputElement;
    const value = this.nearestStop(Number(target.value));
    if (target.value !== String(value)) target.value = String(value);
    this.commit(value);
  }

  onKeydown(event: KeyboardEvent): void {
    const stops = this.snapValues();
    if (!stops || stops.length === 0 || this.isDisabled()) return;

    const last = stops.length - 1;
    const from = this.stopIndex(stops, this.value);
    let to: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        to = from + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        to = from - 1;
        break;
      case 'PageUp':
        to = from + PAGE_STEP;
        break;
      case 'PageDown':
        to = from - PAGE_STEP;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = stops[Math.min(Math.max(to, 0), last)];
    if (next !== undefined) this.commit(next);
  }

  private commit(value: number): void {
    if (value === this.value) return;
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  private nearestStop(raw: number): number {
    const stops = this.snapValues();
    if (!stops || stops.length === 0) return raw;
    return stops[this.stopIndex(stops, raw)] ?? raw;
  }

  private stopIndex(stops: readonly number[], target: number): number {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [index, value] of stops.entries()) {
      const distance = Math.abs(value - target);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }
    return best;
  }

  onBlur(): void {
    this.onTouched();
  }
}
