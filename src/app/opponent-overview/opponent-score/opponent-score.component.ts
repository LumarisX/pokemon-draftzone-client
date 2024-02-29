import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Form,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Pokemon } from '../../interfaces/draft';
import { Matchup } from '../../interfaces/matchup';
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
  templateUrl: './opponent-score.component.html',
})
export class OpponentScoreComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';
  title: string = 'New Matchup';
  matchup!: Matchup;

  constructor(
    private draftService: DraftService,
    private route: ActivatedRoute
  ) {}

  get aTeamArray(): FormArray {
    return this.scoreForm?.get('aTeam.team') as FormArray;
  }

  get bTeamArray(): FormArray {
    return this.scoreForm?.get('bTeam.team') as FormArray;
  }

  scoreForm!: FormGroup;

  ngOnInit(): void {
    this.matchupId = <string>(
      this.route.parent!.parent!.snapshot.paramMap.get('teamid')
    );
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService.getMatchup(this.matchupId).subscribe((data) => {
          this.matchup = <Matchup>data;
          let aTeamArray: FormGroup[] = [];
          for (let pokemon of this.matchup.aTeam.team) {
            aTeamArray.push(
              new FormGroup({
                kills: new FormControl(),
                deaths: new FormControl(),
                brought: new FormControl(),
              })
            );
          }

          let bTeamArray: FormGroup[] = [];
          for (let pokemon of this.matchup.bTeam.team) {
            bTeamArray.push(
              new FormGroup({
                kills: new FormControl(),
                deaths: new FormControl(),
                brought: new FormControl(),
              })
            );
          }
          let aTeamForm = new FormGroup({
            pokePaste: new FormControl(''),
            replay: new FormControl(''),
            score: new FormControl(''),
            team: new FormArray(aTeamArray),
          });
          let bTeamForm = new FormGroup({
            pokePaste: new FormControl(''),
            replay: new FormControl(''),
            score: new FormControl(''),
            team: new FormArray(bTeamArray),
          });
          this.scoreForm = new FormGroup({
            aTeam: aTeamForm,
            bTeam: bTeamForm,
          });
        });
      }
    });
  }

  addANewPokemon(
    index: number = this.aTeamArray.length,
    pokemonData: Pokemon = { pid: '', name: '' }
  ) {
    this.aTeamArray?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  addBNewPokemon(
    index: number = this.aTeamArray.length,
    pokemonData: Pokemon = { pid: '', name: '' }
  ) {
    this.bTeamArray?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  deleteAPokemon(index: number) {
    this.aTeamArray?.removeAt(index);
  }

  deleteBPokemon(index: number) {
    this.bTeamArray?.removeAt(index);
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
