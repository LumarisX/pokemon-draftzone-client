import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Pokemon } from '../../interfaces/draft';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { Matchup } from '../../interfaces/matchup';

@Component({
  selector: 'opponent-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-form.component.html',
})
export class OpponentFormComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';
  title: string = 'New Matchup';
  @Output() reload = new EventEmitter<boolean>();

  constructor(
    private draftService: DraftService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  matchupForm!: FormGroup;

  get teamArray(): FormArray {
    return this.matchupForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.teamId = <string>(
      this.route.parent!.parent!.snapshot.paramMap.get('teamid')
    );

    this.route.queryParams.subscribe((params) => {
      if ('id' in params) {
        // this.teamId = JSON.parse(params['id']);
        // this.draftService.getMatchup(this.teamId).subscribe((data) => {
        //   let draft = <Matchup>data;
        //   this.title = draft.tea;
        //   let pokemonForms: FormGroup[] = [];
        //   for (let pokemon of draft.team) {
        //     pokemonForms.push(PokemonFormComponent.addPokemonForm(pokemon));
        //   }
        //   this.draftForm = new FormGroup(
        //     {
        //       leagueName: new FormControl(
        //         draft.leagueName,
        //         Validators.required
        //       ),
        //       teamName: new FormControl(draft.teamName, Validators.required),
        //       stage: new FormControl(draft.format, Validators.required),
        //       ruleset: new FormControl(draft.ruleset, Validators.required),
        //       team: new FormArray(pokemonForms),
        //     },
        //     [this.validateDraftForm]
        //   );
        // });
      } else {
        this.matchupForm = new FormGroup(
          {
            teamName: new FormControl('', Validators.required),
            stage: new FormControl('', Validators.required),
            team: new FormArray([PokemonFormComponent.addPokemonForm()]),
          },
          [this.validateDraftForm]
        );
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

  validateDraftForm(control: AbstractControl) {
    const formGroup = control as FormGroup;
    const teamArray = formGroup.get('team') as FormArray;
    if (teamArray.length === 0) {
      return { noTeams: true };
    }
    return null;
  }

  //fix depreciated
  onSubmit() {
    if (this.matchupForm.valid) {
      this.draftService
        .newMatchup(this.teamId, this.matchupForm.value)
        .subscribe(
          (response) => {
            console.log('Success!', response);
            // Redirect to '/draft' route
            this.router.navigate(['/draft/' + this.teamId]);
          },
          (error) => console.error('Error!', error)
        );
    } else {
      console.log('Form is invalid.');
    }
  }
}
