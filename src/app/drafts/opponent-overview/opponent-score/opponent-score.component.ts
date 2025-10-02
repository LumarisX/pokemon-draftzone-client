import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PokemonId } from '../../../data/namedex';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { TrashSVG } from '../../../images/svg-components/trash.component';
import { Pokemon } from '../../../interfaces/draft';
import { Matchup } from '../../../interfaces/matchup';
import { DraftService } from '../../../services/draft.service';
import { ReplayService } from '../../../services/replay.service';
import { ReplayData } from '../../../tools/replay_analyzer/replay.interface';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pdz-opponent-score',
  templateUrl: './opponent-score.component.html',
  styleUrls: ['./opponent-score.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    ReactiveFormsModule,
    LoadingComponent,
    MatIconModule,
  ],
})
export class OpponentScoreComponent implements OnInit {
  private fb = inject(FormBuilder);
  private draftService = inject(DraftService);
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  teamId: string = '';
  matchupId: string = '';
  title: string = 'New Matchup';
  matchup!: Matchup;
  scoreForm!: FormGroup;
  selectedMatch = 0;
  readonly draftPath = DraftOverviewPath;

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') || '';
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = params['matchup'];
        this.draftService
          .getMatchup(this.matchupId, this.teamId)
          .subscribe((data) => {
            this.matchup = data;
            this.initForm();
          });
      }
    });
  }

  private initForm(): void {
    const matchArray =
      this.matchup.matches && this.matchup.matches.length
        ? this.matchup.matches.map((m) =>
            this.createMatchGroup(m.aTeam, m.bTeam, m.replay, m.winner),
          )
        : [this.createMatchGroup()];

    this.scoreForm = this.fb.group({
      aTeamPaste: this.matchup.aTeam.paste || '',
      bTeamPaste: this.matchup.bTeam.paste || '',
      matches: this.fb.array(matchArray),
    });
  }

  private createMatchGroup(
    aSide: { stats: [string, any][] } | null = null,
    bSide: { stats: [string, any][] } | null = null,
    replay: string | String | undefined = '',
    winner: 'a' | 'b' | '' | null | undefined = '',
  ) {
    const aStats = aSide ? Object.fromEntries(aSide.stats) : {};
    const bStats = bSide ? Object.fromEntries(bSide.stats) : {};

    const group = this.fb.group({
      aTeam: this.sideForm(this.matchup.aTeam.team, aSide || { stats: [] }),
      bTeam: this.sideForm(this.matchup.bTeam.team, bSide || { stats: [] }),
      replay: replay || '',
      winner: winner || '',
      analyzed: true,
    });

    group.get('replay')?.valueChanges.subscribe(() => {
      if (group.get('analyzed')?.value) {
        group.patchValue({ analyzed: false });
      }
    });

    return group;
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
    } = { stats: [] },
  ): FormGroup {
    let stats = Object.fromEntries(side.stats);
    let teamGroup = team.map((pokemon: Pokemon) => {
      let monGroup = this.fb.group({
        pokemon: pokemon,
        kills: [stats[<PokemonId>pokemon.id]?.kills],
        fainted: [stats[<PokemonId>pokemon.id]?.deaths],
        indirect: [stats[<PokemonId>pokemon.id]?.indirect],
        brought: [stats[<PokemonId>pokemon.id]?.brought],
      });
      monGroup.get('fainted')?.valueChanges.subscribe((fainted) => {
        if (monGroup.get('fainted')?.value) {
          monGroup.patchValue({ brought: 1 });
        }
        let a = this.statCount(this.aTeamArray, ['fainted']);
        let b = this.statCount(this.bTeamArray, ['fainted']);
        if (a > b) {
          this.changeWinner('b');
        } else if (a < b) {
          this.changeWinner('a');
        } else {
          this.changeWinner('');
        }
      });
      monGroup.get('kills')?.valueChanges.subscribe((kills) => {
        if (monGroup.get('kills')?.value) {
          monGroup.patchValue({ brought: 1 });
        }
      });
      monGroup.get('indirect')?.valueChanges.subscribe((indirect) => {
        if (monGroup.get('indirect')?.value) {
          monGroup.patchValue({ brought: 1 });
        }
      });
      return monGroup;
    });
    return this.fb.group({
      team: this.fb.array(teamGroup),
    });
  }

  get aTeamArray(): FormArray {
    return this.matchesFormArray.controls[this.selectedMatch].get(
      'aTeam.team',
    ) as FormArray;
  }

  get bTeamArray(): FormArray {
    return this.matchesFormArray.controls[this.selectedMatch].get(
      'bTeam.team',
    ) as FormArray;
  }

  statCount(teamArray: FormArray, controlNames: string[]) {
    let total = 0;
    for (let control of teamArray.controls) {
      for (let name of controlNames) {
        total += Number(control.get(name)?.value || 0);
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
          this.router.navigate(['/', this.draftPath, this.teamId]);
        },
        error: (error) => {
          console.error('Error!', error);
        },
      });
  }

  addMatch() {
    const group = this.createMatchGroup();
    this.matchesFormArray.push(group);
    this.selectedMatch = this.matchesFormArray.length - 1;
  }

  deleteMatch(index: number) {
    this.matchesFormArray.removeAt(index);
    const len = this.matchesFormArray.length;
    this.selectedMatch = Math.max(0, Math.min(this.selectedMatch, len - 1));
  }

  switchMatch(index: number) {
    this.selectedMatch = index;
  }

  analyzeReplay() {
    if (this.selectedMatchForm.get('analyzed')?.value) return;
    let replayURI = this.selectedMatchForm.get('replay')?.value;
    if (replayURI) {
      this.selectedMatchForm.patchValue({ analyzed: true });
      this.replayService.analyzeReplay(replayURI).subscribe((data) => {
        let replayData: ReplayData = data;
        let aReplayTeam = -1;
        for (let mon of replayData.stats[0].team) {
          let anyFound = mon.formes.some((forme) => {
            if (forme.id) {
              let aFind = this.matchup.aTeam.team.find((muMon) =>
                muMon.id.startsWith(forme.id!),
              );
              let bFind = this.matchup.bTeam.team.find((muMon) =>
                muMon.id.startsWith(forme.id!),
              );
              if (aFind && !bFind) {
                aReplayTeam = 0;
                return true;
              } else if (bFind && !aFind) {
                aReplayTeam = 1;
                return true;
              }
            }
            return false;
          });
          if (anyFound) break;
        }
        if (aReplayTeam >= 0 && aReplayTeam < replayData.stats.length) {
          replayData.stats[aReplayTeam].team.forEach((mon) => {
            if (mon.brought) {
              let replayCtrl = this.aTeamArray.controls.find((ctrl) => {
                return mon.formes.some((forme) =>
                  ctrl.value.pokemon.id.startsWith(forme.id),
                );
              });
              replayCtrl?.patchValue({
                brought: +mon.brought,
                kills: mon.kills[0],
                indirect: mon.kills[1],
                fainted: +mon.fainted,
              });
            }
          });
          replayData.stats[(aReplayTeam + 1) % 2].team.forEach((mon) => {
            if (mon.brought) {
              let replayCtrl = this.bTeamArray.controls.find((ctrl) => {
                return mon.formes.some((forme) =>
                  ctrl.value.pokemon.id.startsWith(forme.id),
                );
              });
              replayCtrl?.patchValue({
                brought: +mon.brought,
                kills: mon.kills[0],
                indirect: mon.kills[1],
                fainted: +mon.fainted,
              });
            }
          });
          if (replayData.stats[aReplayTeam].win) {
            this.selectedMatchForm.patchValue({ winner: 'a' });
          } else if (replayData.stats[(aReplayTeam + 1) % 2].win) {
            this.selectedMatchForm.patchValue({ winner: 'b' });
          }
        }
      });
    }
  }

  changeWinner(player: 'a' | 'b' | '') {
    if (this.selectedMatchForm.get('winner')?.value == player) {
      this.selectedMatchForm.patchValue({ winner: '' });
    } else {
      this.selectedMatchForm.patchValue({ winner: player });
    }
  }

  getWins(player: 'a' | 'b') {
    let sum = 0;
    this.matchesFormArray.controls.forEach((ctrl) => {
      if (ctrl.get('winner')?.value == player) {
        sum++;
      }
    });
    return sum;
  }

  toggleBrought(control: AbstractControl) {
    console.log(control);
    const brought = control.get('brought');
    if (!brought) return;
    brought.setValue(!brought.value);
  }

  broughtControls(teamArray: FormArray) {
    return teamArray.controls.filter(
      (control) => control.get('brought')?.value,
    );
  }
}
