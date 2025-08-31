import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../../services/draft.service';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { ArchiveSVG } from '../../../images/svg-components/archive.component';
import { ArchiveAddSVG } from '../../../images/svg-components/archiveAdd.component';
import { BarChartSVG } from '../../../images/svg-components/barchart.component';
import { EditSVG } from '../../../images/svg-components/edit.component';
import { PlusSVG } from '../../../images/svg-components/plus.component';
import { Draft } from '../../../interfaces/draft';
import { DraftOverviewPath } from '../draft-overview-routing.module';

@Component({
  selector: 'draft-preview',
  standalone: true,
  templateUrl: './draft-preview.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    ArchiveAddSVG,
    EditSVG,
    BarChartSVG,
    PlusSVG,
    LoadingComponent,
    ArchiveSVG,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);

  drafts!: (Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' })[];
  draftPath = DraftOverviewPath;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.draftService.getDraftsList().subscribe((data) => {
      this.drafts = data;
      for (let team of this.drafts) {
        team.menu = 'main';
      }
    });
  }

  archive(teamId: string) {
    this.draftService.archiveDraft(teamId).subscribe((data) => {
      this.reload();
    });
  }

  delete(teamId: string) {
    this.draftService.deleteDraft(teamId).subscribe((data) => {
      this.reload();
    });
  }
}
