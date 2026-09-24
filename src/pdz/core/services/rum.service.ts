import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { AwsRum, AwsRumConfig } from 'aws-rum-web';
import { filter } from 'rxjs';
import { ClientError } from '@pdz/layout/error/error.service';
import { environment } from '@pdz/environments/environment';

type RumConfig = AwsRumConfig & {
  endpoint?: string;
  signing?: boolean;
};

const MAX_PENDING_ERRORS = 20;

@Injectable({
  providedIn: 'root',
})
export class RumService {
  private router = inject(Router);
  private rum: AwsRum | null = null;
  private initialized = false;
  private routeListenerInitialized = false;
  private recordedRoutes = new Set<string>();
  private pendingErrors: Error[] | null = null;

  init(): void {
    if (this.initialized || !environment.rum?.enabled) {
      return;
    }

    const { appId, appVersion, region, ...config } = environment.rum;
    const rumConfig = { ...config } as RumConfig & { enabled?: boolean };
    delete rumConfig.enabled;

    if (!appId || !appVersion || !region) {
      return;
    }

    this.initialized = true;
    this.pendingErrors = [];
    void this.load(appId, appVersion, region, rumConfig);
  }

  private async load(
    appId: string,
    appVersion: string,
    region: string,
    rumConfig: RumConfig,
  ): Promise<void> {
    try {
      const { AwsRum } = await import('aws-rum-web');
      this.rum = new AwsRum(appId, appVersion, region, rumConfig);
      this.initRouteTracking();
      for (const error of this.pendingErrors ?? []) {
        this.rum.recordError(error);
      }
    } catch (error) {
      console.warn('RUM initialization failed', error);
    } finally {
      this.pendingErrors = null;
    }
  }

  private initRouteTracking(): void {
    if (!this.rum || this.routeListenerInitialized) {
      return;
    }

    this.routeListenerInitialized = true;
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const route = this.normalizeRoute(event.urlAfterRedirects);
        if (this.recordedRoutes.has(route)) {
          return;
        }

        this.recordedRoutes.add(route);
        this.rum?.recordPageView(route);
      });
  }

  private normalizeRoute(url: string): string {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      return parsedUrl.pathname.replace(/\/+$/, '') || '/';
    } catch {
      const fallbackPath = url.split(/[?#]/)[0] || '/';
      return fallbackPath.replace(/\/+$/, '') || '/';
    }
  }

  recordClientError(error: ClientError): void {
    if (!this.rum && !this.pendingErrors) {
      return;
    }

    const message = error.error?.message || error.message || 'Client error';
    const errorToRecord = new Error(message);
    errorToRecord.name = error.error?.code || 'ClientError';
    if (error.error?.stack) {
      errorToRecord.stack = error.error.stack;
    }

    if (this.rum) {
      this.rum.recordError(errorToRecord);
    } else if (this.pendingErrors && this.pendingErrors.length < MAX_PENDING_ERRORS) {
      this.pendingErrors.push(errorToRecord);
    }
  }
}
