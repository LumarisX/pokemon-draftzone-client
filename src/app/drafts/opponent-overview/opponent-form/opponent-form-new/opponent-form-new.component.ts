import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../../services/draft.service';
import { DraftOverviewPath } from '../../../draft-overview/draft-overview-routing.module';
import { OpponentFormCoreComponent } from '../opponent-form-core/opponent-form-core.component';
import { LoadingComponent } from '../../../../images/loading/loading.component';

@Component({
  selector: 'opponent-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentFormCoreComponent,
    ReactiveFormsModule,
    MatButtonModule,
    LoadingComponent,
  ],
  styleUrl: '../opponent-form.component.scss',
  templateUrl: './opponent-form-new.component.html',
})
export class OpponentFormNewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private draftService = inject(DraftService);

  teamId: string = '';
  stage?: string;
  readonly draftPath = DraftOverviewPath;

  ngOnInit() {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') ?? '';
    this.route.queryParams.subscribe((params) => {
      if ('stage' in params) {
        this.stage = params['stage'];
      }
    });
  }

  newMatchup(formData: Object) {
    this.draftService.newMatchup(this.teamId, formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        this.router.navigate(['/', this.draftPath, this.teamId]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
