import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../../api/draft.service';
import { getNameByPid } from '../../../../data/namedex';
import { Pokemon } from '../../../../interfaces/draft';
import { PokemonFormGroup } from '../../../../util/forms/team-form/team-form.component';
import { DraftOverviewPath } from '../../draft-overview-routing.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';

@Component({
  selector: 'draft-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    DraftFormCoreComponent,
  ],
  templateUrl: './draft-form-new.component.html',
  styleUrl: '../draft-form.component.scss',
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
    team: FormArray<PokemonFormGroup>;
  }>;
  draftPath = DraftOverviewPath;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private draftService: DraftService,
  ) {}

  params: { team?: Pokemon[] } = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('team' in params) {
        this.params.team = (params['team'] as string[]).map((id) => ({
          id: id,
          name: getNameByPid(id),
        }));
      }
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
