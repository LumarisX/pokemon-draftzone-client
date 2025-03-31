import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../../../api/draft.service';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { ArchiveAddSVG } from '../../../../images/svg-components/archiveAdd.component';
import { BarChartSVG } from '../../../../images/svg-components/barchart.component';
import { EditSVG } from '../../../../images/svg-components/edit.component';
import { Draft } from '../../../../interfaces/draft';
import { DraftOverviewPath } from '../../draft-overview-routing.module';

@Component({
  selector: 'draft-preview',
  standalone: true,
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    ArchiveAddSVG,
    EditSVG,
    BarChartSVG,
  ],
})
export class DraftPreviewComponent {
  @Input()
  draft!: Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' };
  @Output() reloadRequested = new EventEmitter();
  draftPath = DraftOverviewPath;
  constructor(private draftService: DraftService) {}

  archive(teamId: string) {
    this.draftService.archiveDraft(teamId).subscribe((data) => {
      this.reloadRequested.emit();
    });
  }

  delete(teamId: string) {
    this.draftService.deleteDraft(teamId).subscribe((data) => {
      this.reloadRequested.emit();
    });
  }
}
