import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DraftService } from '../../draft.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { Draft } from '../../../draft.model';
import {
  DraftFormCoreComponent,
  DraftFormData,
} from '../draft-form-core/draft-form-core.component';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';

@Component({
  selector: 'pdz-draft-form-edit',
  imports: [DraftFormCoreComponent, LoadingComponent],
  styleUrl: '../draft-form.component.scss',
  templateUrl: './draft-form-edit.component.html',
})
export class DraftFormEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);

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
      error: (error) => console.error('Error!', error),
    });
  }
}
