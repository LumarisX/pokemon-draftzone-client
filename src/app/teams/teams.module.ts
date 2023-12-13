import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TeamsRoutingModule } from './teams-routing.module';
import { TeamsComponent } from './teams.component';

@NgModule({
    imports: [ CommonModule, TeamsComponent, TeamsRoutingModule],
    exports: [ TeamsComponent ]
})
export class TeamsModule { }