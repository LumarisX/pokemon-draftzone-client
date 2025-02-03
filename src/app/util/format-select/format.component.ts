import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { DataService } from '../../api/data.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'format-select',
  imports: [CommonModule, MatSelectModule, MatIconModule, MatTooltipModule],
  templateUrl: './format.component.html',
  styleUrl: './format.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormatSelectComponent),
      multi: true,
    },
  ],
})
export class FormatSelectComponent implements OnInit, ControlValueAccessor {
  formats: [string, { name: string; id: string; desc?: string }[]][] = [];

  _selectedFormat?: string;

  @Input()
  classList?: string | string[] | null;

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
    this.dataService.getFormatsGrouped().subscribe((formats) => {
      this.formats = formats;
      this.selectedFormat = this.formats[0][1][0].id;
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

  triggerString() {
    for (let group of this.formats) {
      for (let format of group[1]) {
        if (format.id === this.selectedFormat)
          return `${group[0]} - ${format.name}`;
      }
    }
    return this.selectedFormat;
  }
}
