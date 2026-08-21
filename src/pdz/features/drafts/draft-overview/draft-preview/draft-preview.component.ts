import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  BadgeComponent,
  BadgeTone,
} from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { TournamentDetails } from '../../../league-zone/league.model';
import { LSDraftData } from '../../../planner/planner.component';
import { Draft } from '../../draft.model';
import { DraftService } from '../draft.service';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { Archive } from '../archive-stats/archive.model';
import { ArchiveService } from '../archive.service';

type Score = { wins: number; losses: number };

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
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SkeletonComponent,
    DisclosureComponent,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);
  private leagueService = inject(LeagueZoneService);
  private archiveService = inject(ArchiveService);
  private dialogs = inject(DialogService);

  readonly skeletonCards = [0, 1, 2];
  readonly skeletonSprites = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  drafts?: Draft[];
  tournaments?: TournamentDetails[];
  archives?: Archive[];
  loadError = false;
  draftPath = DRAFT_OVERVIEW_PATH;

  ngOnInit() {
    this.loadDrafts();
    this.loadTournaments();
    this.loadArchives();
  }

  loadDrafts() {
    this.drafts = undefined;
    this.loadError = false;
    this.draftService.getDraftsList().subscribe({
      next: (data) => {
        this.drafts = data.drafts;
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

  loadArchives() {
    this.archiveService.getDraftsList().subscribe({
      next: (data) => {
        this.archives = data;
      },
      error: (error) => {
        console.error('Failed to load tournaments', error);
        this.tournaments = [];
      },
    });
  }

  async confirmDelete(draft: Draft) {
    const confirmed = await this.dialogs.confirm('Delete draft', {
      message: `Delete ${draft.leagueName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.draftService.deleteDraft(draft.slug).subscribe({
      next: () => this.loadDrafts(),
      error: (error) => console.error('Failed to delete draft', error),
    });
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

  scoreString(score: Score) {
    if (score) return `${score.wins} - ${score.losses}`;
    return `Unscored`;
  }

  scoreTone(score: Score): BadgeTone {
    if (!score) return 'neutral';
    if (score.wins > score.losses) return 'success';
    if (score.wins < score.losses) return 'danger';
    return 'neutral';
  }

  hasAnyDrafts(): boolean {
    return (this.drafts?.length ?? 0) + (this.tournaments?.length ?? 0) > 0;
  }

  unresolvedWarning(draft: Draft): string | null {
    const count = draft.unresolvedPokemon?.length ?? 0;
    if (count === 0) return null;
    return `Some Pokémon are not valid under ${draft.ruleset}`;
  }
}
