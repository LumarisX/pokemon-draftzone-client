import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  input,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { MAT_SELECT_CONFIG, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../services/data.service';
import { MatFormFieldAppearance } from '@angular/material/form-field';

import { IconComponent } from '../../images/icon/icon.component';
@Component({
  selector: 'pdz-format-select',
  imports: [CommonModule, MatSelectModule, IconComponent, MatTooltipModule],
  templateUrl: './format.component.html',
  styleUrl: './format.component.scss',

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormatSelectComponent),
      multi: true,
    },
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'panel-full-screen-on-mobile' },
    },
  ],
})
export class FormatSelectComponent implements OnInit, ControlValueAccessor {
  private dataService = inject(DataService);

  formats: [string, { name: string; id: string; desc?: string }[]][] = [];

  _selectedFormat?: string;

  @Input()
  classList?: string | string[] | null;

  @Input()
  appearance: MatFormFieldAppearance = 'fill';
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
    this.dataService.getFormatsGrouped().subscribe((formats) => {
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

  triggerString() {
    for (let group of this.formats) {
      for (let format of group[1]) {
        if (format.id === this.selectedFormat)
          return `${group[0]} - ${format.name}`;
      }
    }
    return this.selectedFormat;
  }

  onSelectOpen() {
    requestAnimationFrame(() => {
      const overlay = document.querySelector(
        '.mat-mdc-select-panel',
      ) as HTMLElement;
      if (!overlay) return;
      const y = overlay.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--overlay-top', `${y}px`);
    });
  }
}
