import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Draft } from '../../interfaces/draft';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';

@Component({
  selector: 'draft-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './draft-preview.component.html',
})
export class DraftPreviewComponent {
  teams: Draft[] = [];
  archiveConfirm = false;

  constructor(private draftService: DraftService) {}

  ngOnInit() {
    this.draftService.getDraftsList().subscribe((data) => {
      this.teams = <Draft[]>data;
    });
  }
}
