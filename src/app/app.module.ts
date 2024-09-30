import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthModule } from '@auth0/auth0-angular';
import { AppComponent } from './app.component';
import { BodyModule } from './body/body.module';
import { DraftOverviewModule } from './draft-overview/draft-overview.module';
import { LogoSVG } from './images/svg-components/logo.component';
import { LeagueAdModule } from './league-list/league-list.module';
import { MatchupOverviewModule } from './matchup-overview/matchup-overview.module';
import { OpponentOverviewModule } from './opponent-overview/opponent-overview.module';
import { ToolsModule } from './tools/tools.module';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    DraftOverviewModule,
    HttpClientModule,
    ToolsModule,
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
    OpponentOverviewModule,
    LeagueAdModule,
    MatchupOverviewModule,
    RouterModule,
    BodyModule,
    LogoSVG,
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
