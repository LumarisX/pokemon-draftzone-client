import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

type Color = {
  name: string;
  hex?: string;
  onColorHex?: string;
};

type ColorGroup = {
  name: string;
  colors: Color[];
};

@Component({
  selector: 'pdz-color-palette',
  imports: [],
  templateUrl: './color-palette.component.html',
  styleUrl: './color-palette.component.scss',
})
export class ColorPaletteComponent implements AfterViewInit {
  cdr = inject(ChangeDetectorRef);

  colorGroups: ColorGroup[] = [
    {
      name: 'Surface',
      colors: [
        { name: 'background' },
        { name: 'surface' },
        { name: 'surface-variant' },
        { name: 'surface-container-lowest' },
        { name: 'surface-container-low' },
        { name: 'surface-container' },
        { name: 'surface-container-high' },
        { name: 'surface-container-highest' },
        { name: 'outline' },
        { name: 'outline-variant' },
        { name: 'disabled-surface' },
        { name: 'surface-inverse' },
      ],
    },
    {
      name: 'Primary',
      colors: [
        { name: 'primary' },
        { name: 'primary-lighter' },
        { name: 'primary-darker' },
        { name: 'primary-container' },
        { name: 'primary-container-lighter' },
        { name: 'primary-container-darker' },
        { name: 'primary-container-hover' },
        { name: 'primary-hover' },
        { name: 'primary-border' },
        { name: 'primary-subtle' },
      ],
    },
    {
      name: 'Secondary',
      colors: [
        { name: 'secondary' },
        { name: 'secondary-lighter' },
        { name: 'secondary-darker' },
        { name: 'secondary-container' },
        { name: 'secondary-container-lighter' },
        { name: 'secondary-container-darker' },
        { name: 'secondary-container-hover' },
        { name: 'secondary-hover' },
        { name: 'secondary-border' },
        { name: 'secondary-subtle' },
      ],
    },
    {
      name: 'System',
      colors: [
        { name: 'error' },
        { name: 'error-container' },
        { name: 'warning' },
        { name: 'warning-container' },
        { name: 'success' },
        { name: 'success-container' },
        { name: 'info' },
        { name: 'info-container' },
      ],
    },
    {
      name: 'Menu',
      colors: [
        { name: 'menu-background' },
        { name: 'menu-item-text' },
        { name: 'menu-item-hover-background' },
        { name: 'menu-item-selected-background' },
        { name: 'menu-divider' },
      ],
    },
  ];

  ngAfterViewInit(): void {
    this.updateColorValues();
  }

  updateColorValues(): void {
    const computedStyle = getComputedStyle(document.body);
    for (const group of this.colorGroups) {
      for (const color of group.colors) {
        color.hex = computedStyle
          .getPropertyValue(`--pdz-color-${color.name}`)
          .trim();
        color.onColorHex = computedStyle
          .getPropertyValue(`--pdz-color-on-${color.name}`)
          .trim();
      }
    }
    this.cdr.detectChanges();
  }
}
