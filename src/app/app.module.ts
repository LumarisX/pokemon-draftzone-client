import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule } from '@auth0/auth0-angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DraftOverviewModule } from './draft-overview/draft-overview.module';
import { ErrorModule } from './error/error.module';
import { MatchupOverviewModule } from './matchup-overview/matchup-overview.module';
import { OpponentOverviewModule } from './opponent-overview/opponent-overview.module';
import { CoreModule } from './sprite/sprite.module';

@NgModule({
  imports: [
    BrowserModule,
    DraftOverviewModule,
    ErrorModule,
    AuthModule.forRoot({
      domain: 'dev-wspjxi5f6mjqsjea.us.auth0.com',
      clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',

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
    OpponentOverviewModule,
    MatchupOverviewModule,
    CoreModule,
    AppRoutingModule,
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
