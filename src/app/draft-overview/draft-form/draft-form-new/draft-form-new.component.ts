import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../images/sprite.component';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';
import { Namedex } from '../../../data/namedex';

@Component({
  selector: 'draft-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    DraftFormCoreComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form-new.component.html',
})
export class DraftFormNewComponent implements OnInit {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];
  draftForm!: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private draftService: DraftService
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
            })
          );
        }
      } else {
        for (let i = 0; i < 10; i++) {
          teamArray.push(PokemonFormComponent.addPokemonForm());
        }
      }
      this.draftForm = new FormGroup({
        leagueName: new FormControl('', Validators.required),
        teamName: new FormControl('', Validators.required),
        format: new FormControl(
          'format' in params ? params['format'] : '',
          Validators.required
        ),
        ruleset: new FormControl(
          'ruleset' in params ? params['ruleset'] : '',
          Validators.required
        ),
        team: new FormArray(teamArray),
      });
    });
  }

  newDraft(formData: Object) {
    this.draftService.newDraft(formData).subscribe(
      (response) => {
        console.log('Success!', response);
        // Redirect to '/drafts' route
        this.router.navigate(['/drafts']);
      },
      (error) => console.error('Error!', error)
    );
  }
}
