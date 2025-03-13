import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../../api/draft.service';
import { getNameByPid } from '../../../../data/namedex';
import { LoadingComponent } from '../../../../images/loading/loading.component';
import { Pokemon } from '../../../../interfaces/draft';
import { DraftOverviewPath } from '../../draft-overview-routing.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';

@Component({
  selector: 'draft-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DraftFormCoreComponent,
    ReactiveFormsModule,
    LoadingComponent,
  ],
  templateUrl: './draft-form-new.component.html',
  styleUrl: './draft-form-new.component.scss',
})
export class DraftFormNewComponent implements OnInit {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];
  draftForm?: FormGroup<{
    details: FormGroup<{
      leagueName: FormControl<string | null>;
      teamName: FormControl<string | null>;
      format: FormControl<string | null>;
      ruleset: FormControl<string | null>;
      doc: FormControl<string | null>;
    }>;
    team: FormControl<Pokemon[] | null>;
  }>;
  draftPath = DraftOverviewPath;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private draftService: DraftService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    let team: Pokemon[] = [];
    this.route.queryParams.subscribe((params) => {
      if ('team' in params) {
        team = (params['team'] as string[]).map((id) => ({
          id: id,
          name: getNameByPid(id),
        }));
      }
      this.draftForm = this.fb.group({
        details: this.fb.group({
          leagueName: ['', Validators.required],
          teamName: ['', Validators.required],
          format: [
            'format' in params ? params['format'] : 'Singles',
            Validators.required,
          ],
          ruleset: [
            'ruleset' in params ? params['ruleset'] : 'Gen9 NatDex',
            Validators.required,
          ],
          doc: [''],
        }),
        team: [team, Validators.required],
      });
    });
  }

  newDraft(formData: Object) {
    this.draftService.newDraft(formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        this.router.navigate(['/', DraftOverviewPath]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
