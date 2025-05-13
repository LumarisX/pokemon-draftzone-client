import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Draft } from '../../interfaces/draft';
import { DraftService } from '../../services/draft.service';
import { DraftOverviewPath } from './draft-overview-routing.module';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'pdz-draft-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SpriteComponent],
  styleUrl: './draft-overview.component.scss',
  templateUrl: './draft-overview.component.html',
})
export class DraftOverviewComponent {
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
