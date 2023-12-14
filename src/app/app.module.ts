import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './sprite/sprite.module';
import { DraftOverviewModule } from './draft-overview/draft-overview.module';
import { OpponentOverviewModule } from './opponent-overview/opponent-overview.module';
import { MatchupModule } from './matchup/matchup.module';



@NgModule({
  imports: [
    BrowserModule,
    DraftOverviewModule,
    OpponentOverviewModule,
    MatchupModule,
    CoreModule,
    AppRoutingModule
  ],
  declarations: [ AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}