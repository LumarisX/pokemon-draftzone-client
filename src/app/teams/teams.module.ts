import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftOverviewRoutingModule } from './teams-routing.module';
import { TeamsComponent } from './teams.component';

@NgModule({
    imports: [ CommonModule, TeamsComponent, DraftOverviewRoutingModule],
    exports: [ TeamsComponent ]
})
export class TeamsModule { }