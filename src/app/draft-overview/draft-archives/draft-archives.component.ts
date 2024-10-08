import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArchiveService } from '../../api/archive.service';
import { SpriteComponent } from '../../images/sprite.component';
import { BarChartSVG } from '../../images/svg-components/barchart.component';
import { TrashSVG } from '../../images/svg-components/trash.component';
import { Archive } from '../../interfaces/archive';
import { LoadingComponent } from '../../images/loading/loading.component';

@Component({
  selector: 'draft-archives',
  standalone: true,
  templateUrl: './draft-archives.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    BarChartSVG,
    TrashSVG,
    LoadingComponent,
  ],
})
export class DraftArchiveComponent {
  archives!: (Archive & { menu: 'main' | 'archive' | 'edit' | 'delete' })[];

  constructor(private archiveService: ArchiveService) {}

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
