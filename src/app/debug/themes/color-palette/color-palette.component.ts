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
        { name: 'primary-container-low' },
        { name: 'primary-container-high' },
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
        { name: 'secondary-container-low' },
        { name: 'secondary-container-high' },
        { name: 'secondary-container-hover' },
        { name: 'secondary-hover' },
        { name: 'secondary-border' },
        { name: 'secondary-subtle' },
      ],
    },
    {
      name: 'Menu',
      colors: [
        { name: 'menu' },
        { name: 'menu-lighter' },
        { name: 'menu-darker' },
        { name: 'menu-container' },
        { name: 'menu-container-low' },
        { name: 'menu-container-high' },
        { name: 'menu-container-hover' },
        { name: 'menu-hover' },
        { name: 'menu-border' },
        { name: 'menu-subtle' },
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
      name: 'Logo',
      colors: [
        { name: 'logo-ring-1' },
        { name: 'logo-ring-2' },
        { name: 'logo-ring-3' },
        { name: 'logo-ring-4' },
        { name: 'logo-ring-5' },
        { name: 'logo-ring-6' },
        { name: 'logo-ring-7' },
        { name: 'logo-core-1' },
        { name: 'logo-core-2' },
        { name: 'logo-top' },
        { name: 'logo-bottom' },
        { name: 'logo-background' },
      ],
    },
    {
      name: 'Semantic',
      colors: [
        { name: 'positive' },
        { name: 'on-positive' },
        { name: 'positive-container' },
        { name: 'on-positive-container' },
        { name: 'negative' },
        { name: 'on-negative' },
        { name: 'negative-container' },
        { name: 'on-negative-container' },
      ],
    },
    {
      name: 'Scale',
      colors: [
        { name: 'scale-positive-7' },
        { name: 'scale-positive-6' },
        { name: 'scale-positive-5' },
        { name: 'scale-positive-4' },
        { name: 'scale-positive-3' },
        { name: 'scale-positive-2' },
        { name: 'scale-positive-1' },
        { name: 'scale-neutral' },
        { name: 'scale-negative-1' },
        { name: 'scale-negative-2' },
        { name: 'scale-negative-3' },
        { name: 'scale-negative-4' },
        { name: 'scale-negative-5' },
        { name: 'scale-negative-6' },
        { name: 'scale-negative-7' },
      ],
    },
    {
      name: 'Effects',
      colors: [{ name: 'shadow' }, { name: 'scrim' }],
    },
    {
      name: 'Debug',
      colors: [{ name: 'debug' }],
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
