import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Draft } from '../../../interfaces/draft';
import { LSDraftData } from '../../../planner/plannner.component';
import { DraftService } from '../../../services/draft.service';
import { DraftOverviewPath } from '../draft-overview-routing.module';

@Component({
  selector: 'draft-preview',
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    MatIconModule,
    LoadingComponent,
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

  toggleMenu(leagueId: string, event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.menuState[leagueId];
    this.closeAllMenus();
    if (currentState !== 'main') {
      this.menuState[leagueId] = 'main';
    }
  }

  toPlanner(draft: Draft): string {
    const plannerData: Partial<LSDraftData> = {
      team: draft.team.map((t) => ({
        id: t.id,
        capt: !!(t.capt?.dmax || t.capt?.tera?.length || t.capt?.z?.length),
        drafted: true,
        value: null,
        tier: '',
      })),
      format: draft.format,
      ruleset: draft.ruleset,
      draftName: draft.leagueName,
    };
    return JSON.stringify(plannerData);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.closeAllMenus();
  }

  closeAllMenus(): void {
    this.menuState = {};
  }
}
