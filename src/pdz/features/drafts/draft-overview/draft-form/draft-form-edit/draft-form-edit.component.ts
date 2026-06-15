import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../draft.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { Draft } from '../../../draft.model';
import {
  DraftFormCoreComponent,
  DraftFormData,
} from '../draft-form-core/draft-form-core.component';
import { MatButtonModule } from '@angular/material/button';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';

@Component({
  selector: 'pdz-draft-form-edit',
  imports: [
    RouterModule,
    MatButtonModule,
    DraftFormCoreComponent,
    LoadingComponent,
  ],
  styleUrl: '../draft-form.component.scss',
  templateUrl: './draft-form-edit.component.html',
})
export class DraftFormEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);

  teamId: string = '';
  draftPath: string = DRAFT_OVERVIEW_PATH;

  draftParams!: Draft;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (!('draft' in params)) return;
      this.teamId = JSON.parse(params['draft']);
      this.draftService.getDraft(this.teamId).subscribe((draft) => {
        console.log(draft);
        this.draftParams = draft;
      });
    });
  }

  editDraft(formData: DraftFormData) {
    console.log(formData);
    this.draftService.editDraft(this.teamId, formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        this.router.navigate(['/', DRAFT_OVERVIEW_PATH]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
