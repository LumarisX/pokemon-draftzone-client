import { Injectable } from '@angular/core';

export type Settings = {
  theme?: string;
  ldMode?: string;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsData!: Settings;

  constructor() {
    let parsedData: Settings = JSON.parse(
      localStorage.getItem('user-settings') || '{}'
    );
    this.settingsData = parsedData;
    this.updateLDMode(this.settingsData.ldMode);
  }

  updateLDMode(value: string | undefined) {
    if (value === 'light' || value === 'dark') {
      if (value === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } else {
      let devicePref = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      console.log();
      if (!devicePref) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
  }
}
