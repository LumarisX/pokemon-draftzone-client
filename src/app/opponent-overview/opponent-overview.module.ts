import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentOverviewRoutingModule } from './opponent-overview-routing.module';
import { OpponentOverviewComponent } from './opponent-overview.component';

@NgModule({
    imports: [ CommonModule, OpponentOverviewComponent, OpponentOverviewRoutingModule],
    exports: [ OpponentOverviewComponent ]
})
export class OpponentOverviewModule { }