import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Matchup } from '../../interfaces/matchup';
import { CommonModule } from '@angular/common';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { Pokemon } from '../../interfaces/draft';

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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.matchupId =
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
      aTeam: this.fb.group({
        pokePaste: [''],
        score: [''],
        team: this.fb.array(this.initTeamArray(this.matchup.aTeam.team)),
      }),
      bTeam: this.fb.group({
        pokePaste: [''],
        score: [''],
        team: this.fb.array(this.initTeamArray(this.matchup.bTeam.team)),
      }),
      replay: [''],
    });
  }

  private initTeamArray(team: Pokemon[]): FormGroup[] {
    return team.map((pokemon) =>
      this.fb.group({
        pokemon: pokemon,
        kills: [''],
        deaths: [''],
        indirect: [''],
        brought: [''],
      })
    );
  }

  get aTeamArray(): FormArray {
    return this.scoreForm.get('aTeam.team') as FormArray;
  }

  get bTeamArray(): FormArray {
    return this.scoreForm.get('bTeam.team') as FormArray;
  }
}
