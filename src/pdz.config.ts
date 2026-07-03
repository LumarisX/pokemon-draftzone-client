import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAuth0, authHttpInterceptorFn } from '@auth0/auth0-angular';
import { MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';

import { routes } from '@pdz/pdz.routes';
import { environment } from '@pdz/environments/environment';
import { RumService } from '@pdz/core/services/rum.service';
import { SwUpdateService } from '@pdz/core/services/sw-update.service';

export const pdzConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideAnimations(),

    // Setup HTTP and the Auth0 Standalone Interceptor
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),

    // Standalone Auth0 Provider
    provideAuth0({
      domain: environment.auth.domain,
      clientId: environment.auth.clientId,
      useRefreshTokens: true,
      cacheLocation: 'localstorage',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth.audience,
        scope: environment.auth.scope,
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: `${environment.auth.audience}*`,
            tokenOptions: {
              authorizationParams: {
                audience: environment.auth.audience,
                scope: environment.auth.interceptorScope,
              },
            },
          },
        ],
      },
    }),

    // Standalone Service Worker
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.serviceWorkerEnabled ?? environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // Standalone Markdown
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: () => ({ breaks: true }),
      },
    }),

    // App Initializers
    provideAppInitializer(() => inject(RumService).init()),
    provideAppInitializer(() => inject(SwUpdateService).init()),
  ],
};
