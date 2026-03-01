import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  inject,
  isDevMode,
  NgModule,
  provideAppInitializer,
} from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthModule } from '@auth0/auth0-angular';
import { MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { BodyModule } from './body/body.module';
import { TopNavbarComponent } from './pages/top-navbar/top-navbar.component';
import { TooltipModule } from './util/tooltip/tooltip.module';
import { RumService } from './services/rum.service';
import { SwUpdateService } from './services/sw-update.service';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    BodyModule,
    CommonModule,
    BrowserAnimationsModule,
    AuthModule.forRoot({
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
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    TopNavbarComponent,
    TooltipModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideAppInitializer(() => inject(RumService).init()),
    provideAppInitializer(() => inject(SwUpdateService).init()),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: () => ({
          breaks: true,
        }),
      },
    }),
  ],
})
export class AppModule {}
