// debug-themes.component.ts

import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ColorPaletteComponent } from './color-palette/color-palette.component';

@Component({
  selector: 'pdz-debug-themes',
  templateUrl: './debug-themes.component.html',
  styleUrl: './debug-themes.component.scss',
  imports: [ColorPaletteComponent],
})
export class DebugThemesComponent {
  // Split state into theme (palette) and mode (brightness)
  theme: string = 'normal';
  mode: string = 'light';

  setTheme(themeName: string): void {
    this.theme = themeName;
    document.body.setAttribute('pdz-theme', themeName);
    // setTimeout(() => this.updateColorValues(), 0);
  }

  setMode(modeName: 'light' | 'dark'): void {
    this.mode = modeName;
    document.body.setAttribute('pdz-theme-mode', modeName);
    // setTimeout(() => this.updateColorValues(), 0);
  }
}
