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
      },
    }),
    OpponentOverviewModule,
    MatchupModule,
    CoreModule,
    AppRoutingModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }