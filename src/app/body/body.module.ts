import { NgModule } from '@angular/core';
import { DraftOverviewModule } from '../drafts/draft-overview/draft-overview.module';
import { MatchupOverviewModule } from '../drafts/matchup-overview/matchup-overview.module';
import { OpponentOverviewModule } from '../drafts/opponent-overview/opponent-overview.module';
import { LeagueAdModule } from '../league-list/league-list.module';
import { BodyRoutingModule } from './body-routing.module';
import { BodyComponent } from './body.component';

@NgModule({
  imports: [
    BodyComponent,
    DraftOverviewModule,
    MatchupOverviewModule,
    OpponentOverviewModule,
    LeagueAdModule,
    BodyRoutingModule,
  ],
  exports: [BodyComponent],
})
export class BodyModule {}
