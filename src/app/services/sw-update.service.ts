import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private static readonly SW_CLEANUP_DONE_KEY = 'pdzSwCleanupDone';

  init(): void {
    void this.decommissionExistingServiceWorkers();
  }

  private async decommissionExistingServiceWorkers(): Promise<void> {
    if (!this.isBrowserRuntime() || this.hasCompletedCleanup()) {
      return;
    }

    const [hadRegistrations, hadCaches] = await Promise.all([
      this.unregisterExistingServiceWorkers(),
      this.clearServiceWorkerCaches(),
    ]);

    this.markCleanupComplete();

    if (hadRegistrations || hadCaches) {
      console.info('Service worker decommission completed.');
    }
  }

  private isBrowserRuntime(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  private hasCompletedCleanup(): boolean {
    try {
      return (
        localStorage.getItem(SwUpdateService.SW_CLEANUP_DONE_KEY) === 'true'
      );
    } catch {
      return false;
    }
  }

  private markCleanupComplete(): void {
    try {
      localStorage.setItem(SwUpdateService.SW_CLEANUP_DONE_KEY, 'true');
    } catch {
      // Ignore storage errors and retry cleanup on future visits.
    }
  }

  private async unregisterExistingServiceWorkers(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        return false;
      }

      await Promise.all(
        registrations.map(async (registration) => {
          try {
            await registration.unregister();
          } catch (err) {
            console.error('Failed to unregister service worker:', err);
          }
        }),
      );

      return true;
    } catch (err) {
      console.error('Failed to list service worker registrations:', err);
      return false;
    }
  }

  private async clearServiceWorkerCaches(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheKeys = await caches.keys();
      if (cacheKeys.length === 0) {
        return false;
      }

      await Promise.all(
        cacheKeys.map(async (cacheKey) => {
          try {
            await caches.delete(cacheKey);
          } catch (err) {
            console.error('Failed to delete cache:', cacheKey, err);
          }
        }),
      );

      return true;
    } catch (err) {
      console.error('Failed to list cache storage keys:', err);
      return false;
    }
  }
}
