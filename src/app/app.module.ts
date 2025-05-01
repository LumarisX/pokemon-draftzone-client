import { OverlayModule } from '@angular/cdk/overlay';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule, importProvidersFrom, isDevMode } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthModule } from '@auth0/auth0-angular';
import { MarkdownModule, MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';
import { AppComponent } from './app.component';
import { BodyModule } from './body/body.module';
import { LogoSVG } from './images/svg-components/logo.component';
import { SettingsComponent } from './pages/settings/settings.component';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    AuthModule.forRoot({
      domain: 'dev-wspjxi5f6mjqsjea.us.auth0.com',
      clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',
      useRefreshTokens: true,
      cacheLocation: 'localstorage',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
        scope: 'openid profile email read:username',
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/*',
            tokenOptions: {
              authorizationParams: {
                audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
                scope: 'openid profile email read:username',
              },
            },
          },
        ],
      },
    }),
    MatToolbarModule,
    MatBadgeModule,
    OverlayModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
    LogoSVG,
    BodyModule,
    SettingsComponent,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
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
