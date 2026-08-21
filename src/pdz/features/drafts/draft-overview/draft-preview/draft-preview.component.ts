import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { Draft } from '../../draft.model';
import { TournamentDetails } from '../../../league-zone/league.model';
import { DraftService } from '../draft.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { LSDraftData } from '../../../planner/planner.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-draft-preview',
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    TooltipDirective,
    SpriteComponent,
    IconComponent,
    ButtonComponent,
    SkeletonComponent,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);
  private leagueService = inject(LeagueZoneService);

  readonly skeletonCards = [0, 1, 2];
  readonly skeletonSprites = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  drafts?: Draft[];
  tournaments?: TournamentDetails[];
  loadError = false;
  draftPath = DRAFT_OVERVIEW_PATH;
  menuState: {
    [key: string]: '' | 'confirm-archive' | 'confirm-delete';
  } = {};

  openDropdown: string | null = null;

  ngOnInit() {
    this.loadDrafts();
    this.loadTournaments();
  }

  loadDrafts() {
    console.log('Loading drafts...');
    this.drafts = undefined;
    this.loadError = false;
    this.draftService.getDraftsList().subscribe({
      next: (data) => {
        this.drafts = data.drafts;
        this.drafts.forEach((draft) => {
          this.menuState[draft.slug] = '';
        });
      },
      error: (error) => {
        console.error('Failed to load drafts', error);
        this.drafts = [];
        this.tournaments = [];
        this.loadError = true;
      },
    });
  }

  loadTournaments() {
    console.log('Loading tournaments...');
    this.tournaments = undefined;
    this.leagueService.getTournamentsList().subscribe({
      next: (data) => {
        this.tournaments = data.tournaments;
      },
      error: (error) => {
        console.error('Failed to load tournaments', error);
        this.tournaments = [];
      },
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

  setMenuState(slug: string, state: '' | 'confirm-archive' | 'confirm-delete') {
    this.menuState[slug] = state;
  }

  toggleMenu(slug: string, event: MouseEvent) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === slug ? null : slug;
  }

  toPlanner(draft: Draft): string {
    const plannerData: Partial<LSDraftData> = {
      team: draft.team.map((t) => ({
        id: t.id,
        locked: true,
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

  scoreString(score: { wins: number; losses: number }) {
    if (score) return `${score.wins} - ${score.losses}`;
    return `Unscored`;
  }

  scoreClass(score: { wins: number; losses: number }) {
    if (!score) return 'pdz-background-neut';
    if (score.wins > score.losses) return 'pdz-background-pos';
    if (score.wins < score.losses) return 'pdz-background-neg';
    return 'pdz-background-neut';
  }

  hasAnyDrafts(): boolean {
    return (this.drafts?.length ?? 0) + (this.tournaments?.length ?? 0) > 0;
  }

  unresolvedWarning(draft: Draft): string | null {
    const count = draft.unresolvedPokemon?.length ?? 0;
    if (count === 0) return null;
    const names = draft.unresolvedPokemon!.join(', ');
    return `Some Pokémon are not valid under ${draft.ruleset}`;
  }
}
