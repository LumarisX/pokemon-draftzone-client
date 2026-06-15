import { Component, ViewChild } from '@angular/core';
import { ColorBoxComponent } from './color-box/color-box.component';
import { ColorPaletteComponent } from './color-palette/color-palette.component';

@Component({
  selector: 'pdz-debug-themes',
  templateUrl: './debug-themes.component.html',
  styleUrl: './debug-themes.component.scss',
  imports: [ColorPaletteComponent, ColorBoxComponent],
})
export class DebugThemesComponent {
  theme: string = 'classic';
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

  @ViewChild(ColorBoxComponent) colorPalette?: ColorPaletteComponent;

  updateColorValues(): void {
    this.colorPalette?.updateColorValues();
  }
}
