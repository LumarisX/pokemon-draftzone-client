import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Archive } from '../../../interfaces/archive';
import { ArchiveService } from '../../../services/archive.service';
import { DraftOverviewPath } from '../draft-overview-routing.module';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'draft-archives',
  templateUrl: './draft-archives.component.html',
  styleUrl: './draft-archives.component.scss',

  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    MatIconModule,
  ],
})
export class DraftArchiveComponent {
  private archiveService = inject(ArchiveService);

  archives!: (Archive & { menu?: 'main' | 'delete' })[];
  backPath: string = DraftOverviewPath;

  menuState: {
    [key: string]: '' | 'main' | 'confirm-delete';
  } = {};

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

  setMenuState(leagueId: string, state: '' | 'main' | 'confirm-delete') {
    this.menuState[leagueId] = state;
  }

  toggleMenu(leagueId: string) {
    this.menuState[leagueId] =
      this.menuState[leagueId] === 'main' ? '' : 'main';
  }
}
