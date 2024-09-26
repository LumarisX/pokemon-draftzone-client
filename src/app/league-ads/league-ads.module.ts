import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LeagueFormComponent } from './form/league-form.component';
import { LeagueAdRoutingModule } from './league-ads-router.module';
import { LeagueAdListComponent } from './league-list.component';

@NgModule({
  declarations: [LeagueFormComponent, LeagueAdListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LeagueAdRoutingModule,
  ],
  exports: [],
})
export class LeagueAdModule {}
