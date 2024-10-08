import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { SpriteComponent } from '../../images/sprite.component';
import { BarChartSVG } from '../../images/svg-components/barchart.component';
import { EditSVG } from '../../images/svg-components/edit.component';
import { PlusSVG } from '../../images/svg-components/plus.component';
import { TrashSVG } from '../../images/svg-components/trash.component';
import { Draft } from '../../interfaces/draft';
import { ArchiveAddSVG } from '../../images/svg-components/archiveAdd.component';
import { ArchiveSVG } from '../../images/svg-components/archive.component';
import { LoadingComponent } from '../../images/loading/loading.component';

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
    TrashSVG,
    LoadingComponent,
    ArchiveSVG,
  ],
})
export class DraftPreviewComponent {
  drafts!: (Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' })[];

  constructor(private draftService: DraftService) {}

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
