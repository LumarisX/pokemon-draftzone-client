import { Injectable } from '@angular/core';

export type Settings = {
  theme?: string;
  ldMode: 'light' | 'dark' | 'device';
  time?: string;
  date?: string;
  spriteSet?: string;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsData!: Settings;

  constructor() {
    let parsedData: Settings = JSON.parse(
      localStorage.getItem('user-settings') || '{}',
    );
    this.settingsData = parsedData;
    this.updateLDMode(this.settingsData.ldMode);
  }

  updateLDMode(value: string) {
    const isDark =
      (value === 'device' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      value === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.setAttribute(
      'light-mode',
      isDark ? 'dark' : 'light',
    );
  }
}
