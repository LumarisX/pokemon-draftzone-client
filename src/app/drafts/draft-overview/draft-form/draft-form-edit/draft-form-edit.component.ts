import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../../services/draft.service';
import { LoadingComponent } from '../../../../images/loading/loading.component';
import { Draft } from '../../../../interfaces/draft';
import { DraftOverviewPath } from '../../draft-overview-routing.module';
import {
  DraftFormCoreComponent,
  DraftFormData,
} from '../draft-form-core/draft-form-core.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'draft-form-edit',
  standalone: true,
  imports: [
    CommonModule,
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
  draftPath: string = DraftOverviewPath;

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
        this.router.navigate(['/', DraftOverviewPath]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
