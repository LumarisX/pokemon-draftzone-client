import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { Draft } from '../../../interfaces/draft';
import { DraftOverviewPath } from '../../draft-overview-routing.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';

@Component({
  selector: 'draft-form-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DraftFormCoreComponent,
    ReactiveFormsModule,
    LoadingComponent,
  ],
  templateUrl: './draft-form-edit.component.html',
})
export class DraftFormEditComponent implements OnInit {
  teamId: string = '';
  cancelPath: string = DraftOverviewPath;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private draftService: DraftService,
    private fb: FormBuilder,
  ) {}

  draftForm?: FormGroup;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('draft' in params) {
        this.teamId = JSON.parse(params['draft']);
        this.draftService.getDraft(this.teamId).subscribe((data) => {
          let draft = <Draft>data;
          this.draftForm = this.fb.group({
            leagueName: [draft.leagueName, Validators.required],
            teamName: [draft.teamName, Validators.required],
            format: [draft.format, Validators.required],
            ruleset: [draft.ruleset, Validators.required],
            team: [draft.team, Validators.required],
          });
        });
      }
    });
  }

  editDraft(formData: Object) {
    console.log(formData);
    this.draftService.editDraft(this.teamId, formData).subscribe(
      (response) => {
        console.log('Success!', response);
        this.router.navigate(['/', DraftOverviewPath]);
      },
      (error) => console.error('Error!', error),
    );
  }
}
