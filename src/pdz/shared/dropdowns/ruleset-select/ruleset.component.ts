import { Component, forwardRef, OnInit, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataService } from '@pdz/core/services/data.service';
import { GroupedSelectComponent } from '../grouped-select/grouped-select.component';
@Component({
  selector: 'pdz-ruleset-select',
  imports: [GroupedSelectComponent],
  templateUrl: './ruleset.component.html',
  styleUrl: './ruleset.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RulesetSelectComponent),
      multi: true,
    },
  ],
})
export class RulesetSelectComponent implements OnInit, ControlValueAccessor {
  private dataService = inject(DataService);

  rulesets: [string, { name: string; id: string; desc?: string }[]][] = [];

  _selectedRuleset?: string;

  set selectedRuleset(value: string | undefined) {
    this._selectedRuleset = value;
    this.onChange(value);
    this.onTouched();
  }

  get selectedRuleset() {
    return this._selectedRuleset;
  }

  onSelectionChange(value: string | undefined) {
    this.selectedRuleset = value;
  }

  ngOnInit() {
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
      if (!this.selectedRuleset) {
        this.selectedRuleset = rulesets[0][1][0].id;
      }
    });
  }

  private onTouched: () => void = () => {};
  private onChange: (value: string | undefined) => void = () => {};

  writeValue(value: string | undefined): void {
    this.selectedRuleset = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
