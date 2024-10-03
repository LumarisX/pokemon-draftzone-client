import { NgModule } from '@angular/core';
import { DraftOverviewModule } from '../draft-overview/draft-overview.module';
import { LeagueAdModule } from '../league-list/league-list.module';
import { MatchupOverviewModule } from '../matchup-overview/matchup-overview.module';
import { OpponentOverviewModule } from '../opponent-overview/opponent-overview.module';
import { ToolsModule } from '../tools/tools.module';
import { BodyRoutingModule } from './body-routing.module';
import { BodyComponent } from './body.component';

@NgModule({
  imports: [
    BodyComponent,
    ToolsModule,
    DraftOverviewModule,
    MatchupOverviewModule,
    OpponentOverviewModule,
    LeagueAdModule,
    BodyRoutingModule,
  ],
  exports: [BodyComponent],
})
export class BodyModule {}
