import { Component, OnInit } from '@angular/core';
import {
  Form,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Matchup, Side } from '../../interfaces/matchup';
import { CommonModule } from '@angular/common';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { Pokemon } from '../../interfaces/draft';
import { PokemonId } from '../../pokemon';

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
  scoreForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private draftService: DraftService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.teamId =
      this.route.parent!.parent!.snapshot.paramMap.get('teamid') || '';
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService.getMatchup(this.matchupId).subscribe((data) => {
          this.matchup = data as Matchup;
          this.initForm();
        });
      }
    });
  }

  private initForm(): void {
    this.scoreForm = this.fb.group({
      aTeam: this.sideForm(this.matchup.aTeam),
      bTeam: this.sideForm(this.matchup.bTeam),
      replay: [this.matchup.replay],
    });
  }

  private sideForm(side: Side): FormGroup {
    let teamGroup = side.team.map((pokemon: Pokemon) =>
      this.fb.group({
        pokemon: pokemon,
        kills: [side.stats[<PokemonId>pokemon.pid]?.kills],
        deaths: [side.stats[<PokemonId>pokemon.pid]?.deaths],
        indirect: [side.stats[<PokemonId>pokemon.pid]?.indirect],
        brought: [side.stats[<PokemonId>pokemon.pid]?.brought],
      })
    );
    return this.fb.group({
      paste: [side.paste],
      score: [side.score],
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
    console.log('submitted');
    this.draftService
      .scoreMatchup(this.matchupId, this.scoreForm.value)
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
