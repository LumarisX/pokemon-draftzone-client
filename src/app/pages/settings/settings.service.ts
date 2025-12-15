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
  themeOverride?: string | null;
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
  get settings$() {
    return this.settingsData$.asObservable();
  }

  private readonly DEFAULT_THEME: string = 'sunset';

  private themeOverride?: string = 'dripzone';

  constructor() {
    try {
      const localSettings = localStorage.getItem('user-settings');
      if (localSettings) this.settingsData$.next(JSON.parse(localSettings));
    } catch (e) {
      console.warn('Failed to parse local user settings', e);
    }

    this.applyThemeAndMode(this.settingsData);
  }

  updateLDMode(value?: string | null) {
    const isDark =
      value === 'dark' ||
      (value !== 'light' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);

    document.documentElement.setAttribute(
      'pdz-theme-mode',
      isDark ? 'dark' : 'light',
    );
  }

  private applyThemeAndMode(
    settings: Settings,
    options?: { source?: 'local' | 'server' },
  ) {
    const theme =
      this.themeOverride && this.themeOverride === settings.themeOverride
        ? this.DEFAULT_THEME
        : (settings?.theme ?? this.DEFAULT_THEME);
    const ldMode = settings?.ldMode ?? 'device';

    try {
      document.documentElement.setAttribute('pdz-theme', theme);
    } catch (e) {}

    this.updateLDMode(ldMode ?? undefined);
  }

  /**
   * Update settings locally and optionally mark them as coming from the server.
   * This method will not call the server — use saveToServer() for that.
   *
   * @param value Partial settings to merge
   * @param options.source 'server' when these settings came from backend (server wins)
   */
  setSettings(
    value: Partial<Settings> | undefined,
    options?: { source?: 'local' | 'server' },
  ) {
    if (!value) return;
    const merged: Settings = {
      ...this.settingsData,
      ...value,
    };
    merged.themeOverride =
      !this.settingsData.theme && !merged.theme
        ? this.themeOverride
        : undefined;
    this.settingsData$.next(merged);
    try {
      localStorage.setItem('user-settings', JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed to persist user settings to localStorage', e);
    }
    this.applyThemeAndMode(merged, options);
  }

  saveToServer() {
    return this.settingApiService.updateSettings(this.settingsData);
  }

  refreshFromServer() {
    return this.settingApiService.getSettings();
  }
}
