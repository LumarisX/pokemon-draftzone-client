import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
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
  teams: Draft[] | null = null;
  archiveConfirm = false;

  constructor(private draftService: DraftService) {}

  ngOnInit() {
    this.draftService.getDraftsList().subscribe((data) => {
      this.teams = <Draft[]>data;
    });
  }

  archive(teamId: string) {
    this.draftService.archiveDraft(teamId).subscribe((data) => {
      console.log(data);
    });
  }
}
