import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public settingsData!: {
    theme?: string;
    colorblind?: string;
    shinyunlocked?: true;
  };

  constructor() {
    this.settingsData = JSON.parse(
      localStorage.getItem('user-settings') || '{}'
    );
    console.log(this.settingsData);
  }
}
