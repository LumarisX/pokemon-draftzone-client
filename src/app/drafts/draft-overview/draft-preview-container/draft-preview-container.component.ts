import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { ArchiveSVG } from '../../../images/svg-components/archive.component';
import { PlusSVG } from '../../../images/svg-components/plus.component';
import { Draft } from '../../../interfaces/draft';
import { DraftOverviewPath } from '../draft-overview-routing.module';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';

@Component({
  selector: 'draft-preview-container',
  standalone: true,
  templateUrl: './draft-preview-container.component.html',
  styleUrl: './draft-preview-container.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    PlusSVG,
    LoadingComponent,
    ArchiveSVG,
    DraftPreviewComponent,
  ],
})
export class DraftPreviewContainerComponent {
  drafts!: (Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' })[];
  draftPath = DraftOverviewPath;
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
}
