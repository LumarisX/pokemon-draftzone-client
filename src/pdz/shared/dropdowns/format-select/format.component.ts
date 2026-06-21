import { Component, forwardRef, inject, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataService } from '@pdz/core/services/data.service';
import { GroupedSelectComponent } from '../grouped-select/grouped-select.component';

@Component({
  selector: 'pdz-format-select',
  imports: [GroupedSelectComponent],
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
  private dataService = inject(DataService);

  formats: [string, { name: string; id: string; desc?: string }[]][] = [];

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

  ngOnInit() {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
      if (!this.selectedFormat) {
        this.selectedFormat = this.formats[0][1][0].id;
      }
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
