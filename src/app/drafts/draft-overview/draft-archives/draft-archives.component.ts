import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArchiveService } from '../../../services/archive.service';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { TrashSVG } from '../../../images/svg-components/trash.component';
import { Archive } from '../../../interfaces/archive';
import { DraftOverviewPath } from '../draft-overview-routing.module';

@Component({
  selector: 'draft-archives',
  standalone: true,
  templateUrl: './draft-archives.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    TrashSVG,
    LoadingComponent,
  ],
})
export class DraftArchiveComponent {
  private archiveService = inject(ArchiveService);

  archives!: (Archive & { menu: 'main' | 'archive' | 'edit' | 'delete' })[];
  backPath: string = DraftOverviewPath;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.archiveService.getDraftsList().subscribe((data) => {
      this.archives = data;
      for (let archive of this.archives) {
        archive.menu = 'main';
      }
      console.log(this.archives);
    });
  }

  delete(id: string) {
    this.archiveService.deleteDraft(id).subscribe((data) => {
      this.reload();
    });
  }
}
