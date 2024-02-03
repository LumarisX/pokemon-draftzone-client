import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './sprite/sprite.module';
import { DraftOverviewModule } from './draft-overview/draft-overview.module';
import { OpponentOverviewModule } from './opponent-overview/opponent-overview.module';
import { MatchupModule } from './matchup/matchup.module';
import { ErrorModule } from './error/error.module';
import { AuthModule } from '@auth0/auth0-angular';
import { TestModule } from './test/test.module';

@NgModule({
  imports: [
    BrowserModule,
    DraftOverviewModule,
    ErrorModule,
    AuthModule.forRoot({
      // The domain and clientId were configured in the previous chapter
      domain: 'dev-wspjxi5f6mjqsjea.us.auth0.com',
      clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',

      authorizationParams: {
        redirect_uri: window.location.origin,

        // Request this audience at user authentication time
        audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
      },

      // Specify configuration for the interceptor
      httpInterceptor: {
        allowedList: [
          {
            // Match any request that starts 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/' (note the asterisk)
            uri: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/*',
            tokenOptions: {
              authorizationParams: {
                // The attached token should target this audience
                audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',

                // The attached token should have these scopes
                scope: 'read:current_user',
              },
            },
          },
        ],
      },
    }),
    OpponentOverviewModule,
    MatchupModule,
    TestModule,
    CoreModule,
    AppRoutingModule,
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
