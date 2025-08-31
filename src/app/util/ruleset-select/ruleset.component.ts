import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnInit, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_SELECT_CONFIG, MatSelectModule } from '@angular/material/select';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldAppearance } from '@angular/material/form-field';

@Component({
  selector: 'ruleset-select',
  imports: [CommonModule, MatSelectModule, MatIconModule, MatTooltipModule],
  templateUrl: './ruleset.component.html',
  styleUrl: './ruleset.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RulesetSelectComponent),
      multi: true,
    },
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'panel-full-screen-on-mobile' },
    },
  ],
})
export class RulesetSelectComponent implements OnInit, ControlValueAccessor {
  private dataService = inject(DataService);

  rulesets: [string, { name: string; id: string; desc?: string }[]][] = [];

  _selectedRuleset?: string;

  @Input()
  classList?: string | string[] | null;

  @Input()
  appearance: MatFormFieldAppearance = 'fill';
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
    this.dataService.getRulesetsGrouped().subscribe((rulesets) => {
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

  triggerString() {
    for (let group of this.rulesets) {
      for (let ruleset of group[1]) {
        if (ruleset.id === this.selectedRuleset)
          return `${group[0]} - ${ruleset.name}`;
      }
    }
    return this.selectedRuleset;
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
