import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type SlideToggleSize = 'sm' | 'md';

@Component({
  selector: 'pdz-slide-toggle',
  imports: [IconComponent],
  templateUrl: './slide-toggle.component.html',
  styleUrls: ['./slide-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlideToggleComponent),
      multi: true,
    },
  ],
  host: {
    class: 'pdz-slide-toggle',
    '[attr.data-size]': 'size()',
  },
})
export class SlideToggleComponent implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<SlideToggleSize>('md');
  readonly label = input<string>();
  readonly labelBefore = input(false, { transform: booleanAttribute });
  readonly onIcon = input('check');
  readonly offIcon = input('remove');

  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly icon = computed(() =>
    this.checked() ? this.onIcon() : this.offIcon(),
  );
  protected readonly iconSize = computed(() =>
    this.size() === 'sm' ? 10 : 14,
  );

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected toggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
