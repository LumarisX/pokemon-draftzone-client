// debug-themes.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'pdz-debug-themes',
  templateUrl: './debug-themes.component.html',
  styleUrl: './debug-themes.component.scss',
})
export class DebugThemesComponent {
  // Split state into theme (palette) and mode (brightness)
  theme: string = 'normal';
  mode: string = 'light';

  constructor() {}

  setTheme(themeName: string): void {
    this.theme = themeName;
  }

  setMode(modeName: 'light' | 'dark'): void {
    this.mode = modeName;
  }
}
