import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule, isDevMode } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthModule } from '@auth0/auth0-angular';
import { AppComponent } from './app.component';
import { BodyModule } from './body/body.module';
import { TopNavbarComponent } from './pages/top-navbar/top-navbar.component';
import { CommonModule } from '@angular/common';
import { MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    TopNavbarComponent,
    BodyModule,
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
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  declarations: [AppComponent],
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
