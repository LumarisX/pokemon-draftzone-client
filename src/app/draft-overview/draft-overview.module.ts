import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftOverviewRoutingModule } from './draft-overview-routing.module';
import { DraftOverviewComponent } from './draft-overview.component';
import { TeamPreviewComponent } from '../team-preview/team-preview.component';

@NgModule({
    imports: [ CommonModule, DraftOverviewComponent, TeamPreviewComponent, DraftOverviewRoutingModule],
    exports: [ DraftOverviewComponent ]
})
export class DraftOverviewModule { }