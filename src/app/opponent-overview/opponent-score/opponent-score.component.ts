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
import { SpriteService } from '../../sprite/sprite.service';
import { MatchupService } from '../../api/matchup.service';

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
  templateUrl: './opponent-score.component.html',
})
export class OpponentScoreComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';
  title: string = 'New Matchup';
  @Output() reload = new EventEmitter<boolean>();

  constructor(
    private spriteService: SpriteService,
    private draftService: DraftService,
    private route: ActivatedRoute
  ) {}

  aTeamForm!: FormGroup;
  bTeamForm!: FormGroup;

  get aTeamArray(): FormArray {
    return this.aTeamForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.teamId = <string>(
      this.route.parent!.parent!.snapshot.paramMap.get('teamid')
    );
    this.aTeamForm = new FormGroup({
      pokePaste: new FormControl(''),
      score: new FormControl(''),
      team: new FormArray([PokemonFormComponent.addPokemonForm()]),
    });
    this.bTeamForm = new FormGroup({
      pokePaste: new FormControl(''),
      score: new FormControl(''),
      team: new FormArray([PokemonFormComponent.addPokemonForm()]),
    });
    this.draftService.getMatchupList;
  }

  addNewPokemon(
    index: number = this.aTeamArray.length,
    pokemonData: Pokemon = { pid: '' }
  ) {
    console.log(index);
    this.aTeamArray?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  deletePokemon(index: number) {
    this.aTeamArray?.removeAt(index);
  }

  // //fix depreciated
  // onSubmit() {
  //   this.draftService.newMatchup(this.teamId, this.matchupForm.value).subscribe(
  //     (response) => {
  //       console.log('Success!', response);
  //       this.reload.emit(true);
  //     },
  //     (error) => console.error('Error!', error)
  //   );
  // }
}
