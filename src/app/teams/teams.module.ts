import { NgModule } from '@angular/core';
import { TeamsComponent } from './teams.component.ts';
import { CommonModule } from '@angular/common';
import { TeamsRoutingModule } from './teams-routing.module.ts';

@NgModule({
    imports: [ CommonModule, TeamsRoutingModule],
    declarations: [ TeamsComponent ],
    exports: [ TeamsComponent ]
})
export class CoreModule { }