import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { safeStorage } from '@pdz/core/utils/storage';

export type Settings = {
  theme?: string | null;
  ldMode?: string | null;
  time?: string | null;
  date?: string | null;
  spriteSet?: string | null;
  shinyUnlock?: boolean | null;
  themeOverride?: string | null;
};

const STORAGE_KEY = 'user-settings';
const DEFAULT_THEME = 'classic';
const THEME_OVERRIDE = '6526';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiService = inject(ApiService);
  private readonly state = signal<Settings>(
    safeStorage.getJson<Settings>(STORAGE_KEY) ?? {},
  );

  readonly settings = this.state.asReadonly();

  get settingsData(): Settings {
    return this.state();
  }

  constructor() {
    this.applyThemeAndMode(this.state());
  }

  updateLDMode(value?: string | null) {
    const isDark =
      value === 'dark' ||
      (value !== 'light' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    root.setAttribute('pdz-theme-mode', isDark ? 'dark' : 'light');
  }

  private applyThemeAndMode(settings: Settings) {
    const theme =
      settings.themeOverride === THEME_OVERRIDE
        ? DEFAULT_THEME
        : (settings.theme ?? DEFAULT_THEME);
    document.documentElement.setAttribute('pdz-theme', theme);
    this.updateLDMode(settings.ldMode ?? 'device');
  }

  setSettings(value: Partial<Settings> | null | undefined) {
    if (!value) return;
    const current = this.state();
    const merged: Settings = { ...current, ...value };
    merged.themeOverride =
      !current.theme && !merged.theme ? THEME_OVERRIDE : undefined;
    this.state.set(merged);
    safeStorage.setJson(STORAGE_KEY, merged);
    this.applyThemeAndMode(merged);
  }

  saveToServer() {
    return this.updateSettings(this.state());
  }

  refreshFromServer() {
    return this.getSettings();
  }

  getSettings() {
    return this.apiService.get<Settings | null>(`users/settings`);
  }

  updateSettings(settingData: Partial<Settings>) {
    return this.apiService.patch(`users/settings`, settingData);
  }
}
