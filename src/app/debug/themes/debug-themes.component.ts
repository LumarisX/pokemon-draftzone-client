// debug-themes.component.ts

import { Component, ViewChild } from '@angular/core';
import { ColorPaletteComponent } from './color-palette/color-palette.component';

@Component({
  selector: 'pdz-debug-themes',
  templateUrl: './debug-themes.component.html',
  styleUrl: './debug-themes.component.scss',
  imports: [ColorPaletteComponent],
})
export class DebugThemesComponent {
  theme: string = 'normal';
  mode: string = 'light';

  setTheme(themeName: string): void {
    this.theme = themeName;
    document.documentElement.setAttribute('pdz-theme', themeName);
    setTimeout(() => this.updateColorValues(), 0);
  }

  setMode(modeName: 'light' | 'dark'): void {
    this.mode = modeName;
    document.documentElement.setAttribute('pdz-theme-mode', modeName);
    setTimeout(() => this.updateColorValues(), 0);
  }

  @ViewChild(ColorPaletteComponent) colorPalette?: ColorPaletteComponent;

  updateColorValues(): void {
    this.colorPalette?.updateColorValues();
  }
}
