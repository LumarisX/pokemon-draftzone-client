import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { Matchup } from '../../../interfaces/matchup';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoreModule } from '../../../sprite/sprite.module';
import { OpponentFormCoreComponent } from '../opponent-form-core/opponent-form-core.component';

@Component({
  selector: 'opponent-form-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    OpponentFormCoreComponent,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-form-edit.component.html',
})
export class OpponentFormEditComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private draftService: DraftService
  ) {}

  opponentForm: FormGroup = new FormGroup({
    stage: new FormControl('', Validators.required),
    teamName: new FormControl('', Validators.required),
    team: new FormArray([PokemonFormComponent.addPokemonForm()]),
  });

  get teamArray(): FormArray {
    return this.opponentForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.teamId = <string>(
      this.route.parent!.parent!.snapshot.paramMap.get('teamid')
    );
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService.getMatchup(this.matchupId).subscribe((data) => {
          let matchup = <Matchup>data;
          let pokemonForms: FormGroup[] = [];
          for (let pokemon of matchup.bTeam.team) {
            pokemonForms.push(PokemonFormComponent.addPokemonForm(pokemon));
          }
          this.opponentForm = new FormGroup({
            teamName: new FormControl(
              matchup.bTeam.teamName,
              Validators.required
            ),
            stage: new FormControl(matchup.stage, Validators.required),
            team: new FormArray(pokemonForms),
          });
        });
      }
    });
  }

  editMatchup(formData: Object) {
    this.draftService.editMatchup(this.matchupId, formData).subscribe(
      (response) => {
        console.log('Success!', response);
        this.router.navigate([`/draft/${this.teamId}`]);
      },
      (error) => console.error('Error!', error)
    );
  }
}
