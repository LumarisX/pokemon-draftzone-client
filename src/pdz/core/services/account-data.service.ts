import { inject, Injectable, Injector } from '@angular/core';
import {
  PLANNER_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SYNC_MARKER_SUFFIX,
  syncMarkerKey,
} from '@pdz/core/utils/account-storage';
import { safeStorage } from '@pdz/core/utils/storage';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';

type SyncMarker = { sub?: string; json?: string };

@Injectable({ providedIn: 'root' })
export class AccountDataService {
  private readonly injector = inject(Injector);

  async clearForLogout(sub: string | null): Promise<boolean> {
    const markers = this.markedPlannerKeys();
    const unsynced = markers.filter((key) => this.hasUnsyncedPlans(key, sub));
    if (unsynced.length > 0 && !(await this.confirmDiscard())) return false;
    for (const key of markers) {
      safeStorage.remove(key);
      safeStorage.remove(syncMarkerKey(key));
    }
    safeStorage.remove(SETTINGS_STORAGE_KEY);
    this.injector.get(SettingsService).reset();
    return true;
  }

  private markedPlannerKeys(): string[] {
    return safeStorage
      .keys()
      .filter(
        (key) =>
          key.startsWith(PLANNER_STORAGE_KEY) &&
          key.endsWith(SYNC_MARKER_SUFFIX),
      )
      .map((key) => key.slice(0, -SYNC_MARKER_SUFFIX.length));
  }

  private hasUnsyncedPlans(key: string, sub: string | null): boolean {
    const marker = safeStorage.getJson<SyncMarker>(syncMarkerKey(key));
    if (!marker) return false;
    if (sub && marker.sub && marker.sub !== sub) return false;
    const plans = safeStorage.get(key);
    return plans !== null && plans !== marker.json;
  }

  private confirmDiscard(): Promise<boolean> {
    return this.injector.get(DialogService).confirm('Log Out With Unsaved Plans?', {
      message:
        'Some planner changes have not been saved to your account and will be removed from this browser.',
      confirmLabel: 'Log Out Anyway',
      cancelLabel: 'Cancel',
      confirmColor: 'danger',
    });
  }
}
