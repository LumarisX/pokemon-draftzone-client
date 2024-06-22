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
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { Matchup } from '../../interfaces/matchup';
import { LoadingComponent } from '../../loading/loading.component';
import { PokemonId } from '../../pokemon';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';

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
  matchSize = 1;
  selectedMatch = 0;

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
    let matchArray = [];
    for (let i in this.matchup.matches) {
      matchArray.push(
        this.fb.group({
          aTeam: this.sideForm(
            this.matchup.aTeam.team,
            this.matchup.matches[i].aTeam
          ),
          bTeam: this.sideForm(
            this.matchup.bTeam.team,
            this.matchup.matches[i].bTeam
          ),
          replay: this.matchup.matches[i].replay,
        })
      );
    }
    this.scoreForm = this.fb.group({
      aTeamPaste: this.matchup.aTeam.paste,
      bTeamPaste: this.matchup.bTeam.paste,
      matches: this.fb.array(matchArray),
    });
  }

  get matchesFormArray(): FormArray {
    return this.scoreForm.get('matches') as FormArray;
  }

  get selectedMatchForm(): FormGroup {
    return this.matchesFormArray.controls[this.selectedMatch] as FormGroup;
  }

  private sideForm(
    team: Pokemon[],
    side: {
      stats: [string, any][];
      score: number;
    } = { stats: [], score: 0 }
  ): FormGroup {
    let stats = Object.fromEntries(side.stats);
    let teamGroup = team.map((pokemon: Pokemon) =>
      this.fb.group({
        pokemon: pokemon,
        kills: [stats[<PokemonId>pokemon.pid]?.kills],
        deaths: [stats[<PokemonId>pokemon.pid]?.deaths],
        indirect: [stats[<PokemonId>pokemon.pid]?.indirect],
        brought: [stats[<PokemonId>pokemon.pid]?.brought],
      })
    );
    return this.fb.group({
      score: [side.score],
      team: this.fb.array(teamGroup),
    });
  }

  get aTeamArray(): FormArray {
    return this.matchesFormArray.controls[this.selectedMatch].get(
      'aTeam.team'
    ) as FormArray;
  }

  get bTeamArray(): FormArray {
    return this.matchesFormArray.controls[this.selectedMatch].get(
      'bTeam.team'
    ) as FormArray;
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

  submit() {
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

  addMatch() {
    this.matchesFormArray.push(
      this.fb.group({
        aTeam: this.sideForm(this.matchup.aTeam.team),
        bTeam: this.sideForm(this.matchup.bTeam.team),
        replay: '',
      })
    );
    this.selectedMatch = this.matchSize - 1;
    return;
  }

  deleteMatch(index: number) {
    this.matchesFormArray.removeAt(index);
    this.matchSize--;
    this.selectedMatch = 0;
  }

  switchMatch(index: number) {
    this.selectedMatch = index;
  }
}
