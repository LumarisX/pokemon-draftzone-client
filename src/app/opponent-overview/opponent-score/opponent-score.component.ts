import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Pokemon } from '../../interfaces/draft';
import { Match, Matchup, Side } from '../../interfaces/matchup';
import { LoadingComponent } from '../../loading/loading.component';
import { PokemonId } from '../../pokemon';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../images/sprite.component';

@Component({
  selector: 'opponent-form',
  standalone: true,
  templateUrl: './opponent-score.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
    LoadingComponent,
  ],
})
export class OpponentScoreComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';
  title: string = 'New Matchup';
  matchup!: Matchup;
  scoreForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private draftService: DraftService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') || '';
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService
          .getMatchup(this.matchupId, this.teamId)
          .subscribe((data) => {
            console.log(this.matchupId, this.teamId, data);
            this.matchup = data as Matchup;
            this.initForm();
          });
      }
    });
  }

  private initForm(): void {
    this.scoreForm = this.fb.group({
      aTeam: this.sideForm(this.matchup, 'aTeam'),
      bTeam: this.sideForm(this.matchup, 'bTeam'),
      replay: [this.matchup.matches[0].replay],
    });
  }

  private sideForm(matchup: Matchup, side: 'aTeam' | 'bTeam'): FormGroup {
    let stats = Object.fromEntries(matchup.matches[0][side].stats);
    let teamGroup = matchup[side].team.map((pokemon: Pokemon) =>
      this.fb.group({
        pokemon: pokemon,
        kills: [stats[<PokemonId>pokemon.pid]?.kills],
        deaths: [stats[<PokemonId>pokemon.pid]?.deaths],
        indirect: [stats[<PokemonId>pokemon.pid]?.indirect],
        brought: [stats[<PokemonId>pokemon.pid]?.brought],
      })
    );
    return this.fb.group({
      paste: [matchup[side].paste],
      score: [matchup.matches[0][side].score],
      team: this.fb.array(teamGroup),
    });
  }

  get aTeamArray(): FormArray {
    return this.scoreForm.get('aTeam.team') as FormArray;
  }

  get bTeamArray(): FormArray {
    return this.scoreForm.get('bTeam.team') as FormArray;
  }

  statCount(teamArray: FormArray, controlNames: string[]) {
    let total = 0;
    for (let control of teamArray.controls) {
      for (let name of controlNames) {
        total += control.get(name)?.value;
      }
    }

    return total;
  }

  onSubmit() {
    this.draftService
      .scoreMatchup(this.matchupId, this.teamId, this.scoreForm.value)
      .subscribe({
        next: (response) => {
          console.log('Success!', response);
          this.router.navigate([`/draft/${this.teamId}`]);
        },
        error: (error) => {
          console.error('Error!', error);
        },
      });
  }
}
