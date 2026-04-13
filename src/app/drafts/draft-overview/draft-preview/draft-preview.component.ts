import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../images/icon/icon.component';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Draft } from '../../../interfaces/draft';
import { LSDraftData } from '../../../planner/plannner.component';
import { DraftService } from '../../../services/draft.service';
import { DraftOverviewPath } from '../draft-overview-routing.module';
import { TournamentDetails } from '../../../interfaces/league';

@Component({
  selector: 'pdz-draft-preview',
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    IconComponent,
    LoadingComponent,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);

  drafts?: Draft[];
  tournaments?: TournamentDetails[];
  draftPath = DraftOverviewPath;
  menuState: {
    [key: string]: '' | 'confirm-archive' | 'confirm-delete';
  } = {};

  openDropdown: string | null = null;

  ngOnInit() {
    this.loadDrafts();
  }

  loadDrafts() {
    console.log('Loading drafts...');
    this.drafts = undefined;
    this.draftService.getDraftsList().subscribe((data) => {
      this.drafts = data.drafts;
      this.drafts.forEach((draft) => {
        this.menuState[draft.tournamentId] = '';
      });
      this.tournaments = data.tournaments;
      this.tournaments.forEach((tournament) => {
        this.menuState[tournament.tournamentKey] = '';
      });
    });
  }

  archive(teamId: string) {
    this.draftService.archiveDraft(teamId).subscribe(() => {
      console.log('Archived draft');
      this.loadDrafts();
    });
  }

  delete(teamId: string) {
    this.draftService.deleteDraft(teamId).subscribe(() => {
      this.loadDrafts();
    });
  }

  setMenuState(
    tournamentId: string,
    state: '' | 'confirm-archive' | 'confirm-delete',
  ) {
    this.menuState[tournamentId] = state;
  }

  toggleMenu(tournamentId: string, event: MouseEvent) {
    event.stopPropagation();
    this.openDropdown =
      this.openDropdown === tournamentId ? null : tournamentId;
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
    this.closeDropdown();
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  scoreString(draft: { score: { wins: number; losses: number } }) {
    if (draft.score) return `${draft.score.wins} - ${draft.score.losses}`;
    return `Unscored`;
  }

  scoreClass(draft: { score: { wins: number; losses: number } }) {
    if (!draft.score) return 'pdz-background-neut';
    if (draft.score.wins > draft.score.losses) return 'pdz-background-pos';
    if (draft.score.wins < draft.score.losses) return 'pdz-background-neg';
    return 'pdz-background-neut';
  }

  hasAnyDrafts(): boolean {
    return (this.drafts?.length ?? 0) + (this.tournaments?.length ?? 0) > 0;
  }
}
