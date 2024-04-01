import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../services/api/draft.service';
import { Draft } from '../../interfaces/draft';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
  selector: 'draft-preview',
  standalone: true,
  templateUrl: './draft-preview.component.html',
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    LoadingComponent,
  ],
})
export class DraftPreviewComponent {
  teams: (Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' })[] | null =
    null;

  constructor(private draftService: DraftService) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.teams = null;
    this.draftService.getDraftsList().subscribe((data) => {
      this.teams = <
        (Draft & { menu: 'main' | 'archive' | 'edit' | 'delete' })[]
      >data;
      for (let team of this.teams) {
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
