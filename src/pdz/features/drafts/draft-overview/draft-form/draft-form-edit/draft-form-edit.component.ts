import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { Draft } from '@pdz/features/drafts/draft.model';
import {
  DraftFormCoreComponent,
  DraftFormData,
} from '../draft-form-core/draft-form-core.component';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { apiErrorMessage } from '@pdz/core/services/api.service';

@Component({
  selector: 'pdz-draft-form-edit',
  imports: [DraftFormCoreComponent, SkeletonLayoutComponent, PageComponent],
  styleUrl: '../draft-form.component.scss',
  templateUrl: './draft-form-edit.component.html',
})
export class DraftFormEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);
  private toast = inject(ToastService);

  teamId: string = '';
  draftParams!: Draft;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (!('draft' in params)) return;
      this.teamId = JSON.parse(params['draft']);
      this.draftService.getDraft(this.teamId).subscribe((draft) => {
        this.draftParams = draft;
      });
    });
  }

  editDraft(formData: DraftFormData) {
    this.draftService.editDraft(this.teamId, formData).subscribe({
      next: () => {
        this.router.navigate(['/', DRAFT_OVERVIEW_PATH]);
      },
      error: (error) =>
        this.toast.error(apiErrorMessage(error, 'Could not save the draft.')),
    });
  }
}
