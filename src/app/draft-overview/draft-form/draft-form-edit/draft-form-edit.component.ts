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
import { DataService } from '../../../api/data.service';
import { DraftService } from '../../../api/draft.service';
import { Draft, Pokemon } from '../../../interfaces/draft';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoreModule } from '../../../sprite/sprite.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';

@Component({
  selector: 'draft-form-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    DraftFormCoreComponent,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form-edit.component.html',
})
export class DraftFormEditComponent implements OnInit {
  teamId: string = '';

  constructor(
    private route: ActivatedRoute,
    private draftService: DraftService
  ) {}

  draftForm: FormGroup = new FormGroup({
    leagueName: new FormControl('', Validators.required),
    teamName: new FormControl('', Validators.required),
    format: new FormControl('', Validators.required),
    ruleset: new FormControl('', Validators.required),
    team: new FormArray([PokemonFormComponent.addPokemonForm()]),
  });

  get teamArray(): FormArray {
    return this.draftForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('draft' in params) {
        this.teamId = JSON.parse(params['draft']);
        this.draftService.getDraft(this.teamId).subscribe((data) => {
          let draft = <Draft>data;
          let pokemonForms: FormGroup[] = [];
          for (let pokemon of draft.team) {
            pokemonForms.push(PokemonFormComponent.addPokemonForm(pokemon));
          }
          this.draftForm = new FormGroup({
            leagueName: new FormControl(draft.leagueName, Validators.required),
            teamName: new FormControl(draft.teamName, Validators.required),
            format: new FormControl(draft.format, Validators.required),
            ruleset: new FormControl(draft.ruleset, Validators.required),
            team: new FormArray(pokemonForms),
          });
        });
      }
    });
  }
}
