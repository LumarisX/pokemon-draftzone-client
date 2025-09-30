import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Draft } from '../../../interfaces/draft';
import { DraftService } from '../../../services/draft.service';
import { DraftOverviewPath } from '../draft-overview-routing.module';
import { IconButtonComponent } from '../../../components/buttons/icon-button/icon-button.component';

@Component({
  selector: 'draft-preview',
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    MatIconModule,
    LoadingComponent,
    IconButtonComponent,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);

  drafts?: Draft[];
  draftPath = DraftOverviewPath;
  menuState: {
    [key: string]: '' | 'main' | 'confirm-archive' | 'confirm-delete';
  } = {};

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.drafts = undefined;
    this.draftService.getDraftsList().subscribe((data) => {
      this.drafts = data;
      this.drafts.forEach((draft) => {
        this.menuState[draft.leagueId] = '';
      });
    });
  }

  archive(teamId: string) {
    this.draftService.archiveDraft(teamId).subscribe(() => {
      this.reload();
    });
  }

  delete(teamId: string) {
    this.draftService.deleteDraft(teamId).subscribe(() => {
      this.reload();
    });
  }

  setMenuState(
    leagueId: string,
    state: '' | 'main' | 'confirm-archive' | 'confirm-delete',
  ) {
    this.menuState[leagueId] = state;
  }

  toggleMenu(leagueId: string) {
    this.menuState[leagueId] =
      this.menuState[leagueId] === 'main' ? '' : 'main';
  }
}
