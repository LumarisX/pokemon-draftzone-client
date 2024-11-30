import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { Namedex } from '../../../data/namedex';
import { PokemonFormComponent } from '../../../util/forms/pokemon-form/pokemon-form.component';
import { DraftOverviewPath } from '../../draft-overview-routing.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';
import { LoadingComponent } from '../../../images/loading/loading.component';

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
})
export class DraftFormNewComponent implements OnInit {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];
  draftForm?: FormGroup;
  draftPath = DraftOverviewPath;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private draftService: DraftService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    let teamArray: AbstractControl[] = [];
    this.route.queryParams.subscribe((params) => {
      if ('team' in params) {
        for (let id of params['team']) {
          teamArray.push(
            PokemonFormComponent.addPokemonForm({
              id: id,
              name: Namedex[id].name[0],
            }),
          );
        }
      }
      this.draftForm = this.fb.group({
        leagueName: ['', Validators.required],
        teamName: ['', Validators.required],
        format: [
          'format' in params ? params['format'] : '',
          Validators.required,
        ],
        ruleset: [
          'ruleset' in params ? params['ruleset'] : '',
          Validators.required,
        ],
        team: [],
      });
    });
  }

  newDraft(formData: Object) {
    this.draftService.newDraft(formData).subscribe(
      (response) => {
        console.log('Success!', response);
        // Redirect to Draft Overview component
        this.router.navigate(['/', DraftOverviewPath]);
      },
      (error) => console.error('Error!', error),
    );
  }
}
