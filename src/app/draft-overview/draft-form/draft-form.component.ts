import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Draft, Pokemon } from '../../interfaces/draft';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { DataService } from '../../api/data.service';

@Component({
  selector: 'draft-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form.component.html',
})
export class DraftFormComponent implements OnInit {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];

  constructor(
    private route: ActivatedRoute,
    private draftService: DraftService,
    private dataService: DataService
  ) {}

  draftForm!: FormGroup;

  get teamArray(): FormArray {
    return this.draftForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.draftForm = new FormGroup({
      leagueName: new FormControl(''),
      teamName: new FormControl(''),
      format: new FormControl(''),
      ruleset: new FormControl(''),
      team: new FormArray([PokemonFormComponent.addPokemonForm()]),
    });

    this.dataService.getFormats().subscribe((formats) => {
      this.formats = <any>formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = <any>rulesets;
    });

    this.route.queryParams.subscribe((params) => {
      if ('draft' in params) {
        this.teamId = JSON.parse(params['draft']);
        this.draftService.getDraft(this.teamId).subscribe((data) => {
          let draft = <Draft>data;
          this.title = draft.leagueName;
          let pokemonForms: FormGroup[] = [];
          for (let pokemon of draft.team) {
            pokemonForms.push(PokemonFormComponent.addPokemonForm(pokemon));
          }
          this.draftForm = new FormGroup({
            leagueName: new FormControl(draft.leagueName),
            teamName: new FormControl(draft.teamName),
            format: new FormControl(draft.format),
            ruleset: new FormControl(draft.ruleset),
            team: new FormArray(pokemonForms),
          });
        });
      }
    });
  }

  addNewPokemon(
    index: number = this.teamArray.length,
    pokemonData: Pokemon = { pid: '', name: '' }
  ) {
    console.log(index);
    this.teamArray?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  deletePokemon(index: number) {
    this.teamArray?.removeAt(index);
  }

  //fix depreciated
  onSubmit() {
    this.draftService.newMatchup(this.teamId, this.draftForm.value).subscribe(
      (response) => {
        console.log('Success!', response);
      },
      (error) => console.error('Error!', error)
    );
  }
}
