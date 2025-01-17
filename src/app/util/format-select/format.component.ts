import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatOption,
  MatSelect,
} from '@angular/material/select';
import { DataService } from '../../api/data.service';

@Component({
  selector: 'format-select',
  imports: [CommonModule, MatFormField, MatLabel, MatOption, MatSelect],
  templateUrl: './format.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormatSelectComponent),
      multi: true,
    },
  ],
})
export class FormatSelectComponent implements OnInit, ControlValueAccessor {
  formats: string[] = [];

  _selectedFormat?: string;

  set selectedFormat(value: string | undefined) {
    this._selectedFormat = value;
    this.onChange(value);
    this.onTouched();
  }

  get selectedFormat() {
    return this._selectedFormat;
  }

  onSelectionChange(value: string | undefined) {
    this.selectedFormat = value;
  }

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
  }

  private onTouched: () => void = () => {};
  private onChange: (value: string | undefined) => void = () => {};

  writeValue(value: string | undefined): void {
    this.selectedFormat = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
