import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthModule } from '@auth0/auth0-angular';
import { AppComponent } from './app.component';
import { BodyModule } from './body/body.module';
import { LogoSVG } from './images/svg-components/logo.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
    AuthModule.forRoot({
      domain: 'dev-wspjxi5f6mjqsjea.us.auth0.com',
      clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',
      useRefreshTokens: true,
      cacheLocation: 'localstorage',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/*',
            tokenOptions: {
              authorizationParams: {
                audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
                scope: 'read:current_user',
              },
            },
          },
        ],
      },
    }),
    RouterModule,
    LogoSVG,
    BodyModule,
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
