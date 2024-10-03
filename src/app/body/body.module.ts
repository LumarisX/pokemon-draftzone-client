import { NgModule } from '@angular/core';
import { LeagueAdModule } from '../league-list/league-list.module';
import { BodyRoutingModule } from './body-routing.module';
import { BodyComponent } from './body.component';

@NgModule({
  imports: [BodyComponent, LeagueAdModule, BodyRoutingModule],
  exports: [BodyComponent],
})
export class BodyModule {}
