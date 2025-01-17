import { CommonModule } from '@angular/common';
import { Component, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatOption,
  MatSelect,
} from '@angular/material/select';
import { DataService } from '../../api/data.service';

@Component({
  selector: 'ruleset-select',
  imports: [CommonModule, MatFormField, MatLabel, MatOption, MatSelect],
  templateUrl: './ruleset.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RulesetSelectComponent),
      multi: true,
    },
  ],
})
export class RulesetSelectComponent implements OnInit, ControlValueAccessor {
  rulesets: string[] = [];

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

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
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
