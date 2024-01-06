import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftOverviewRoutingModule } from './draft-overview-routing.module';
import { DraftOverviewComponent } from './draft-overview.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';

@NgModule({
    imports: [CommonModule, DraftOverviewComponent, DraftPreviewComponent, DraftOverviewRoutingModule],
    exports: [DraftOverviewComponent]
})
export class DraftOverviewModule { }