import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);
  private updateAvailable = false;

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

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
        this.updateAvailable = true;
        await this.activateUpdate();
        // Notify other tabs about the update
        this.notifyOtherTabs();
      });

    // Listen for updates from other tabs
    window.addEventListener('storage', (event) => {
      if (
        event.key === 'pdzAppUpdate' &&
        event.newValue === 'updateAvailable'
      ) {
        console.log('Update detected from another tab');
        this.reloadPage();
      }
    });
  }

  private async activateUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      // Reload after a small delay to ensure update is activated
      setTimeout(() => {
        this.reloadPage();
      }, 500);
    } catch (err) {
      console.error('Failed to activate update:', err);
    }
  }

  private notifyOtherTabs(): void {
    try {
      // Use localStorage to notify other tabs/windows
      localStorage.setItem('pdzAppUpdate', 'updateAvailable');
      // Clear after a short delay
      setTimeout(() => {
        localStorage.removeItem('pdzAppUpdate');
      }, 100);
    } catch (err) {
      console.error('Failed to notify other tabs:', err);
    }
  }

  private reloadPage(): void {
    // Hard refresh to ensure we get the latest version
    window.location.href = window.location.href;
  }
}
