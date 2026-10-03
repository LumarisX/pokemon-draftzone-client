import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataService } from '@pdz/core/services/data.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';

type OptionGroup = [string, { name: string; id: string; desc?: string }[]];

@Component({
  selector: 'pdz-ruleset-select',
  imports: [FieldComponent, SelectComponent, SelectOptionComponent],
  templateUrl: './ruleset.component.html',
  styleUrl: './ruleset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RulesetSelectComponent),
      multi: true,
    },
  ],
})
export class RulesetSelectComponent implements ControlValueAccessor {
  protected readonly rulesets = signal<OptionGroup[]>([]);
  protected readonly selected = signal<string | undefined>(undefined);
  protected readonly disabled = signal(false);

  private onTouched: () => void = () => {};
  private onChange: (value: string | undefined) => void = () => {};

  constructor() {
    inject(DataService)
      .getRulesets()
      .pipe(takeUntilDestroyed())
      .subscribe((rulesets) => {
        this.rulesets.set(rulesets);
        const first = rulesets[0]?.[1][0]?.id;
        if (!this.selected() && first) {
          this.selected.set(first);
          this.onChange(first);
        }
      });
  }

  protected select(value: string | undefined) {
    this.selected.set(value);
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: string | undefined): void {
    this.selected.set(value ?? undefined);
  }

  registerOnChange(fn: (value: string | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
