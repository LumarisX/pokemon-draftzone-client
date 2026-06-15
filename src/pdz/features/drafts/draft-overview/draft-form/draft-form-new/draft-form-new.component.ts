import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../draft.service';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { DraftPokemon } from '../../../draft.model';
import { PokemonFormGroup } from '@pdz/shared/forms/team-form/team-form.component';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';

@Component({
  selector: 'pdz-draft-form-new',
  imports: [RouterModule, MatButtonModule, DraftFormCoreComponent],
  templateUrl: './draft-form-new.component.html',
  styleUrl: '../draft-form.component.scss',
})
export class DraftFormNewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private draftService = inject(DraftService);
  private location = inject(Location);

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
  draftPath = DRAFT_OVERVIEW_PATH;

  params: { team?: DraftPokemon[] } = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('team' in params) {
        this.params.team = (params['team'] as string[]).map((id) => ({
          id: id,
          name: getNameByPid(id),
        }));
      }
      this.location.replaceState(this.location.path().split('?')[0]);
    });
  }

  newDraft(formData: Object) {
    this.draftService.newDraft(formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        this.router.navigate(['/', DRAFT_OVERVIEW_PATH]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
