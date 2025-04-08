import { Injectable } from '@angular/core';
import { SettingApiService } from '../../api/setting.service';
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
  settingsData$ = new BehaviorSubject<Settings>({});
  get settingsData() {
    return this.settingsData$.value;
  }

  constructor(private settingApiService: SettingApiService) {
    // this.settingsData$.pipe().subscribe()
    // this.updateLDMode(this.settingsData.ldMode);
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

  refreshSettings() {
    this.settingApiService.getSettings().subscribe((settings) => {
      if (settings) this.settingsData$.next(settings);
    });
  }

  setSettings(value: Partial<Settings>) {
    this.settingsData$.next(Object.assign(this.settingsData, value));
  }

  updateSettings() {
    this.settingApiService
      .updateSettings(this.settingsData)
      .subscribe((data) => {
        console.log('Settings Updated:', data);
      });
  }
}
