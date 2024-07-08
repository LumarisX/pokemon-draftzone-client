import { Injectable } from '@angular/core';

export type Settings = {
  theme: string;
  colorblind: string;
  shinyunlocked: true;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public settingsData!: Settings;

  constructor() {
    let parsedData: Settings = JSON.parse(
      localStorage.getItem('user-settings') || '{}'
    );
    if (!parsedData.theme) {
      parsedData.theme = 'device';
    }
    if (!parsedData.colorblind) {
      parsedData.colorblind = 'none';
    }
    this.settingsData = parsedData;
  }
}
