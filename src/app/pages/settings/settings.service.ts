import { Injectable, inject } from '@angular/core';
import { SettingApiService } from '../../services/setting.service';
import { BehaviorSubject } from 'rxjs';

export type Settings = {
  theme?: string | null;
  ldMode?: string | null;
  time?: string | null;
  date?: string | null;
  spriteSet?: string | null;
  shinyUnlock?: boolean | null;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settingApiService = inject(SettingApiService);

  settingsData$ = new BehaviorSubject<Settings>({});
  get settingsData() {
    return this.settingsData$.value;
  }

  constructor() {
    const localSettings = localStorage.getItem('user-settings');
    if (localSettings) this.settingsData$.next(JSON.parse(localSettings));
  }

  updateLDMode(value?: string | null) {
    const isDark =
      (!value && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      value === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.setAttribute(
      'light-mode',
      isDark ? 'dark' : 'light',
    );
  }

  // refreshSettings() {
  //   this.settingApiService.getSettings().subscribe((settings) => {
  //     if (settings) this.settingsData$.next(settings);
  //   });
  // }

  setSettings(value: Partial<Settings> | undefined) {
    if (!value) return;
    this.settingsData$.next(Object.assign(this.settingsData, value));
    localStorage.setItem('user-settings', JSON.stringify(value));
  }

  updateSettings() {
    this.settingApiService
      .updateSettings(this.settingsData)
      .subscribe((data) => {
        console.log('Settings Updated:', data);
      });
  }
}
