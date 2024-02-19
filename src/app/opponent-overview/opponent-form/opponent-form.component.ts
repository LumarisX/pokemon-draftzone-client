import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Pokemon } from '../../interfaces/draft';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';

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
    private route: ActivatedRoute
  ) {}

  matchupForm!: FormGroup;

  get teamArray(): FormArray {
    return this.matchupForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.teamId = <string>(
      this.route.parent!.parent!.snapshot.paramMap.get('teamid')
    );
    this.matchupForm = new FormGroup({
      teamName: new FormControl(''),
      stage: new FormControl(''),
      team: new FormArray([PokemonFormComponent.addPokemonForm()]),
    });
    this.route.queryParams.subscribe((params) => {
      this.draftService.getMatchupList(this.teamId).subscribe((matchups) => {
        console.log(matchups);
      });
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
    this.draftService.newMatchup(this.teamId, this.matchupForm.value).subscribe(
      (response) => {
        console.log('Success!', response);
        this.reload.emit(true);
      },
      (error) => console.error('Error!', error)
    );
  }
}
