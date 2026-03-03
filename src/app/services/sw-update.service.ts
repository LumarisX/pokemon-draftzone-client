import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private static readonly UPDATE_SIGNAL_KEY = 'pdzAppUpdate';
  private static readonly LAST_RELOADED_HASH_KEY = 'pdzLastReloadedHash';

  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.listenForCrossTabUpdates();

    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable),
    );
    // Check every 30 minutes, not 6 hours
    const everyThirtyMinutes$ = interval(30 * 60 * 1000);
    const everyThirtyMinutesOnceAppIsStable$ = concat(
      appIsStable$,
      everyThirtyMinutes$,
    );

    everyThirtyMinutesOnceAppIsStable$.subscribe(async () => {
      try {
        await this.swUpdate.checkForUpdate();
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });

    // Check for updates when window regains focus
    window.addEventListener('focus', () => {
      this.swUpdate.checkForUpdate().catch((err) => {
        console.error('Failed to check for updates on focus:', err);
      });
    });

    // Check for updates when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate().catch((err) => {
          console.error('Failed to check for updates on visibility:', err);
        });
      }
    });

    // Listen for version updates from service worker
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(async (evt) => {
        console.log(
          'New version available:',
          evt.currentVersion,
          '->',
          evt.latestVersion,
        );
        await this.activateAndReload(evt.latestVersion.hash);
      });

    this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('Unrecoverable service worker state:', event.reason);
      this.reloadPage();
    });
  }

  private async activateAndReload(latestHash: string): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      this.notifyOtherTabs(latestHash);
      this.markReloadedHash(latestHash);
      this.reloadPage();
    } catch (err) {
      console.error('Failed to activate update:', err);
    }
  }

  private listenForCrossTabUpdates(): void {
    window.addEventListener('storage', (event) => {
      if (event.key !== SwUpdateService.UPDATE_SIGNAL_KEY || !event.newValue) {
        return;
      }

      const update = this.parseUpdatePayload(event.newValue);
      if (!update?.hash) {
        return;
      }

      if (this.hasReloadedForHash(update.hash)) {
        return;
      }

      this.markReloadedHash(update.hash);
      console.log('Update detected from another tab:', update.hash);
      this.reloadPage();
    });
  }

  private notifyOtherTabs(hash: string): void {
    try {
      localStorage.setItem(
        SwUpdateService.UPDATE_SIGNAL_KEY,
        JSON.stringify({ hash, ts: Date.now() }),
      );
    } catch (err) {
      console.error('Failed to notify other tabs:', err);
    }
  }

  private parseUpdatePayload(
    payload: string,
  ): { hash: string; ts: number } | null {
    try {
      return JSON.parse(payload) as { hash: string; ts: number };
    } catch {
      return null;
    }
  }

  private hasReloadedForHash(hash: string): boolean {
    return (
      sessionStorage.getItem(SwUpdateService.LAST_RELOADED_HASH_KEY) === hash
    );
  }

  private markReloadedHash(hash: string): void {
    sessionStorage.setItem(SwUpdateService.LAST_RELOADED_HASH_KEY, hash);
  }

  private reloadPage(): void {
    window.location.reload();
  }
}
