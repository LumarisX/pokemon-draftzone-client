import { Component, OnInit, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DRAFT_AREA, draftLinks } from '@pdz/features/drafts/draft-area';
import { Draft } from '@pdz/features/drafts/draft.model';
import { Opponent } from '../opponent.model';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import {
  OpponentFormCoreComponent,
  OpponentFormData,
} from './opponent-form-core/opponent-form-core.component';

@Component({
  selector: 'pdz-opponent-form',
  imports: [OpponentFormCoreComponent, SkeletonLayoutComponent, PageComponent],
  styleUrl: './opponent-form.component.scss',
  templateUrl: './opponent-form.component.html',
})
export class OpponentFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);
  private toast = inject(ToastService);

  teamId: string = '';
  matchupId: string | null = null;
  private readonly area = inject(DRAFT_AREA);
  oppParams: Partial<Opponent> | null = null;
  title: string = '';
  submitLabel: string = '';
  isEditMode = false;

  readonly draft = input<Draft>();

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamId') ?? '';

    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.isEditMode = true;
        this.title = 'Edit Opponent';
        this.submitLabel = 'Save Changes';
        this.matchupId = params['matchup'];
        this.oppParams = null;
        this.draftService
          .getOpponent(this.matchupId!, this.teamId)
          .subscribe((opponent) => {
            this.oppParams = opponent;
          });
      } else {
        this.isEditMode = false;
        this.title = 'New Opponent';
        this.submitLabel = 'Create Opponent';
        const stage = params['stage'];
        this.oppParams = { stage: stage };
      }
    });
  }

  saveOpponent(formData: OpponentFormData) {
    const serviceCall = this.isEditMode
      ? this.draftService.editMatchup(this.matchupId!, this.teamId, formData)
      : this.draftService.newMatchup(this.teamId, formData);

    serviceCall.subscribe({
      next: () =>
        this.router.navigate(draftLinks(this.teamId, this.area).page),
      error: (error) =>
        this.toast.error(
          apiErrorMessage(error, 'Could not save the opponent.'),
        ),
    });
  }
}
