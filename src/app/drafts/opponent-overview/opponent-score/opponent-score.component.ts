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
import { DraftService } from '../../../services/draft.service';
import { ReplayService } from '../../../services/replay.service';
import { PokemonId } from '../../../data/namedex';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { IconComponent } from '../../../images/icon/icon.component';
import { DraftPokemon } from '../../../interfaces/draft';
import { Matchup } from '../../../interfaces/matchup';
import { ReplayData } from '../../../tools/replay_analyzer/replay.interface';

@Component({
  selector: 'pdz-opponent-form',
  templateUrl: './opponent-score.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    ReactiveFormsModule,
    IconComponent,
    LoadingComponent,
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
  matchSize = 1;
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
    let matchArray = [];
    if (this.matchup.matches.length === 0) {
      let matchGroup = this.fb.group({
        aTeam: this.sideForm(this.matchup.aTeam.team),
        bTeam: this.sideForm(this.matchup.bTeam.team),
        replay: '',
        winner: '',
        analyzed: true,
      });
      matchGroup.get('replay')?.valueChanges.subscribe((replay) => {
        if (matchGroup.get('analyzed')?.value) {
          matchGroup.patchValue({ analyzed: false });
        }
      });
      matchArray.push(matchGroup);
    } else {
      for (let i in this.matchup.matches) {
        let matchGroup = this.fb.group({
          aTeam: this.sideForm(
            this.matchup.aTeam.team,
            this.matchup.matches[i].aTeam,
          ),
          bTeam: this.sideForm(
            this.matchup.bTeam.team,
            this.matchup.matches[i].bTeam,
          ),
          replay: this.matchup.matches[i].replay,
          winner: this.matchup.matches[i].winner || '',
          analyzed: true,
        });
        matchGroup.get('replay')?.valueChanges.subscribe((replay) => {
          if (matchGroup.get('analyzed')?.value) {
            matchGroup.patchValue({ analyzed: false });
          }
        });
        matchArray.push(matchGroup);
      }
    }
    this.scoreForm = this.fb.group({
      aTeamPaste: this.matchup.aTeam.paste || '',
      bTeamPaste: this.matchup.bTeam.paste || '',
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
    team: DraftPokemon[],
    side: {
      stats: [string, any][];
    } = { stats: [] },
  ): FormGroup {
    let stats = Object.fromEntries(side.stats);
    let teamGroup = team.map((pokemon: DraftPokemon) => {
      let monGroup = this.fb.group({
        pokemon: pokemon,
        kills: [stats[<PokemonId>pokemon.id]?.kills ?? 0],
        fainted: [stats[<PokemonId>pokemon.id]?.deaths ?? 0],
        indirect: [stats[<PokemonId>pokemon.id]?.indirect ?? 0],
        brought: [stats[<PokemonId>pokemon.id]?.brought ?? 0],
      });
      monGroup.get('fainted')?.valueChanges.subscribe((fainted) => {
        if (monGroup.get('fainted')?.value) {
          monGroup.patchValue({ brought: 1 });
        }
        let a = this.statCount(this.aTeamArray, ['fainted']);
        let b = this.statCount(this.bTeamArray, ['fainted']);
        if (a > b) {
          this.setWinner('b');
        } else if (a < b) {
          this.setWinner('a');
        } else {
          this.setWinner('');
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
        total += Number(control.get(name)?.value ?? 0);
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
    let matchGroup = this.fb.group({
      aTeam: this.sideForm(this.matchup.aTeam.team),
      bTeam: this.sideForm(this.matchup.bTeam.team),
      replay: '',
      winner: '',
      analyzed: true,
    });
    matchGroup.get('replay')?.valueChanges.subscribe((replay) => {
      if (matchGroup.get('analyzed')?.value) {
        matchGroup.patchValue({ analyzed: false });
      }
    });
    this.matchSize++;
    this.matchesFormArray.push(matchGroup);
    this.selectedMatch = this.matchSize - 1;
    return;
  }

  deleteMatch(index: number) {
    this.matchesFormArray.removeAt(index);
    this.matchSize--;
    this.selectedMatch = 0;
  }

  spriteBrought(pokemonForm: AbstractControl<any, any>) {
    return pokemonForm.value.brought ? '' : 'opacity-40';
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
        let replayData = data.analysis;
        let aReplayTeam = -1;
        for (let mon of replayData.players[0].team) {
          let anyFound = mon.formes.some((forme) => {
            let aFind = this.matchup.aTeam.team.find((muMon) =>
              muMon.id.startsWith(forme),
            );
            let bFind = this.matchup.bTeam.team.find((muMon) =>
              muMon.id.startsWith(forme),
            );
            if (aFind && !bFind) {
              aReplayTeam = 0;
              return true;
            }
            if (bFind && !aFind) {
              aReplayTeam = 1;
              return true;
            }
            return false;
          });
          if (anyFound) break;
        }
        if (aReplayTeam >= 0 && aReplayTeam < replayData.players.length) {
          replayData.players[aReplayTeam].team.forEach((mon) => {
            if (mon.status !== 'brought') {
              let replayCtrl = this.aTeamArray.controls.find((ctrl) =>
                mon.formes.includes(ctrl.value.pokemon.id),
              );
              replayCtrl?.patchValue({
                brought: 1,
                kills: mon.kills.direct,
                indirect: mon.kills.indirect,
                fainted: mon.status === 'fainted' ? 1 : 0,
              });
            }
          });
          replayData.players[(aReplayTeam + 1) % 2].team.forEach((mon) => {
            if (mon.status !== 'brought') {
              let replayCtrl = this.bTeamArray.controls.find((ctrl) =>
                mon.formes.includes(ctrl.value.pokemon.id),
              );
              replayCtrl?.patchValue({
                brought: 1,
                kills: mon.kills.direct,
                indirect: mon.kills.indirect,
                fainted: mon.status === 'fainted' ? 1 : 0,
              });
            }
          });
          const aWin = replayData.players[aReplayTeam].win;
          const bWin = replayData.players[(aReplayTeam + 1) % 2].win;
          if (aWin && !bWin) {
            this.setWinner('a');
          } else if (bWin && !aWin) {
            this.setWinner('b');
          } else {
            const aFainted = this.statCount(this.aTeamArray, ['fainted']);
            const bFainted = this.statCount(this.bTeamArray, ['fainted']);
            if (aFainted > bFainted) {
              this.setWinner('b');
            } else if (aFainted < bFainted) {
              this.setWinner('a');
            } else {
              this.setWinner('');
            }
          }
        }
      });
    }
  }

  private setWinner(player: 'a' | 'b' | '') {
    this.selectedMatchForm.patchValue({ winner: player });
  }

  changeWinner(player: 'a' | 'b' | '') {
    if (this.selectedMatchForm.get('winner')?.value == player) {
      this.selectedMatchForm.patchValue({ winner: '' });
    } else {
      this.selectedMatchForm.patchValue({ winner: player });
    }
  }

  winnerClass(player: 'a' | 'b') {
    return this.selectedMatchForm.get('winner')?.value == player
      ? `shadow `
      : `shadow-inner text-symbolColor-disabled`;
  }

  gameClass(i: number) {
    return this.selectedMatch == i
      ? 'bg-menu-100'
      : 'bg-menu-250 hover:bg-menu-200';
  }

  analyzeClass() {
    return this.selectedMatchForm.get('analyzed')?.value
      ? 'shadow-none opacity-50'
      : 'hover:bg-menu-250 shadow';
  }

  broughtCaution() {
    return this.statCount(this.aTeamArray, ['brought']) ===
      this.statCount(this.bTeamArray, ['brought'])
      ? ''
      : 'px-2 bg-caution rounded-full';
  }

  aKillCaution() {
    return this.statCount(this.aTeamArray, ['kills', 'indirect']) ===
      this.statCount(this.bTeamArray, ['fainted'])
      ? ''
      : 'px-2 bg-caution rounded-full';
  }

  bKillCaution() {
    return this.statCount(this.bTeamArray, ['kills', 'indirect']) ===
      this.statCount(this.aTeamArray, ['fainted'])
      ? ''
      : 'px-2 bg-caution rounded-full';
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
}
