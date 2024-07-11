import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArchiveService } from '../../api/archive.service';
import { SpriteComponent } from '../../images/sprite.component';
import { BarChartSVG } from '../../images/svg-components/barchart.component';
import { TrashSVG } from '../../images/svg-components/trash.component';
import { LoadingComponent } from '../../loading/loading.component';

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
  archives: any;

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

  delete(teamId: string) {
    this.archiveService.deleteDraft(teamId).subscribe((data) => {
      this.reload();
    });
  }
}
