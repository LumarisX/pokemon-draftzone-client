import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DRAFT_OVERVIEW_PATH,
  LEAGUE_ZONE_PATH,
  PLANNER_PATH,
} from '@pdz/core/route-paths';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { Archive } from '@pdz/features/drafts/draft-overview/archive.model';
import { Draft } from '@pdz/features/drafts/draft.model';
import { TournamentDetails } from '@pdz/features/league-zone/league.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { LSDraftData } from '@pdz/features/planner/planner.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { BadgeTone } from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ScoreComponent } from '@pdz/shared/data/score/score.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  TEAM_PHOTO_SIZE,
  TeamPhotoComponent,
} from '@pdz/shared/images/team-photo/team-photo.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

type Score = { wins: number; losses: number };

@Component({
  selector: 'pdz-draft-preview',
  templateUrl: './draft-preview.component.html',
  styleUrl: './draft-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    RouterLink,
    TooltipDirective,
    SpriteComponent,
    TeamPhotoComponent,
    IconComponent,
    ButtonComponent,
    ScoreComponent,
    CardComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SkeletonComponent,
    DisclosureComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class DraftPreviewComponent {
  private draftService = inject(DraftService);
  private leagueService = inject(LeagueZoneService);
  private dialogs = inject(DialogService);
  private toasts = inject(ToastService);

  readonly skeletonCards = [0, 1, 2];
  readonly photoSize = TEAM_PHOTO_SIZE;
  readonly draftPath = DRAFT_OVERVIEW_PATH;
  readonly plannerPath = PLANNER_PATH;

  readonly drafts = signal<Draft[] | undefined>(undefined);
  readonly tournaments = signal<TournamentDetails[] | undefined>(undefined);
  readonly archives = signal<Archive[]>([]);
  readonly loadError = signal(false);

  readonly hasAnyDrafts = computed(
    () => (this.drafts()?.length ?? 0) + (this.tournaments()?.length ?? 0) > 0,
  );

  constructor() {
    this.loadDrafts();
    this.loadTournaments();
    this.loadArchives();
  }

  tournamentPath(tournament: TournamentDetails): string[] {
    return [
      '/',
      LEAGUE_ZONE_PATH,
      tournament.leagueSlug,
      'tournaments',
      tournament.tournamentSlug,
    ];
  }

  loadDrafts() {
    this.drafts.set(undefined);
    this.loadError.set(false);
    this.draftService.getDraftsList().subscribe({
      next: (data) => this.drafts.set(data.drafts),
      error: () => {
        this.drafts.set([]);
        this.tournaments.set([]);
        this.loadError.set(true);
      },
    });
  }

  loadTournaments() {
    this.tournaments.set(undefined);
    this.leagueService.getTournamentsList().subscribe({
      next: (data) => this.tournaments.set(data.tournaments),
      error: () => this.tournaments.set([]),
    });
  }

  loadArchives() {
    this.draftService.getArchiveList().subscribe({
      next: (data) => this.archives.set(data),
      error: () => this.archives.set([]),
    });
  }

  async confirmArchive(draft: Draft) {
    const confirmed = await this.dialogs.confirm('Archive this draft?', {
      message: `${draft.leagueName} will be archived. This can be undone.`,
      confirmLabel: 'Archive',
    });
    if (!confirmed) return;

    this.draftService.archiveDraft(draft.slug).subscribe({
      next: () => {
        this.loadDrafts();
        this.loadArchives();
      },
      error: () => this.toasts.error('Could not archive that draft.'),
    });
  }

  restore(archive: Archive) {
    if (!archive.slug) return;

    this.draftService.unarchiveDraft(archive.slug).subscribe({
      next: () => {
        this.loadDrafts();
        this.loadArchives();
      },
      error: () => this.toasts.error('Could not restore that draft.'),
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
      error: () => this.toasts.error('Could not delete that draft.'),
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
    return score ? `${score.wins} - ${score.losses}` : 'Unscored';
  }

  scoreTone(score: Score): BadgeTone {
    if (!score) return 'neutral';
    if (score.wins > score.losses) return 'success';
    if (score.wins < score.losses) return 'danger';
    return 'neutral';
  }

  restNames(team: { name: string }[]): string | null {
    const rest = team.slice(TEAM_PHOTO_SIZE);
    return rest.length ? rest.map((pokemon) => pokemon.name).join(', ') : null;
  }

  unresolvedWarning(draft: Draft): string | null {
    const count = draft.unresolvedPokemon?.length ?? 0;
    if (count === 0) return null;
    return `Some Pokémon are not valid under ${draft.ruleset}`;
  }
}
