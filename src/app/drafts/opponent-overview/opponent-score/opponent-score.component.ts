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
import { ReplayAnalysis } from '../../../tools/replay_analyzer/replay.interface';

@Component({
  selector: 'pdz-opponent-form',
  templateUrl: './opponent-score.component.html',
  styleUrl: './opponent-score.component.scss',
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
    const selectedMatchForm = this.selectedMatchForm;
    const replayURI = selectedMatchForm.get('replay')?.value;
    if (!replayURI) return;
    selectedMatchForm.patchValue({ analyzed: true });
    this.replayService.analyzeReplay(replayURI).subscribe({
      next: (data) => {
        const replayData = data.analysis;
        const teamMapping = this.resolveReplayTeamMapping(replayData);
        if (!teamMapping) {
          console.warn(
            'Could not confidently map replay players to draft sides.',
          );
          selectedMatchForm.patchValue({ analyzed: false });
          return;
        }

        const aTeamArray = this.getTeamArray(selectedMatchForm, 'aTeam');
        const bTeamArray = this.getTeamArray(selectedMatchForm, 'bTeam');

        this.resetTeamStats(aTeamArray);
        this.resetTeamStats(bTeamArray);

        const aPlayer = replayData.players[teamMapping.aPlayerIndex];
        const bPlayer = replayData.players[teamMapping.bPlayerIndex];

        this.applyReplayStats(aTeamArray, aPlayer.team);
        this.applyReplayStats(bTeamArray, bPlayer.team);

        if (aPlayer.win && !bPlayer.win) {
          selectedMatchForm.patchValue({ winner: 'a' });
        } else if (bPlayer.win && !aPlayer.win) {
          selectedMatchForm.patchValue({ winner: 'b' });
        } else {
          selectedMatchForm.patchValue({ winner: '' });
        }
      },
      error: () => {
        selectedMatchForm.patchValue({ analyzed: false });
      },
    });
  }

  private resolveReplayTeamMapping(replayData: ReplayAnalysis): {
    aPlayerIndex: number;
    bPlayerIndex: number;
  } | null {
    if (replayData.players.length !== 2) {
      return null;
    }

    const aDraftFormes = this.getSideDraftFormes(this.matchup.aTeam.team);
    const bDraftFormes = this.getSideDraftFormes(this.matchup.bTeam.team);

    const p0ToA = this.countFormeMatches(replayData.players[0], aDraftFormes);
    const p0ToB = this.countFormeMatches(replayData.players[0], bDraftFormes);
    const p1ToA = this.countFormeMatches(replayData.players[1], aDraftFormes);
    const p1ToB = this.countFormeMatches(replayData.players[1], bDraftFormes);

    const directAssignmentScore = p0ToA + p1ToB;
    const swappedAssignmentScore = p0ToB + p1ToA;

    if (directAssignmentScore > swappedAssignmentScore) {
      return { aPlayerIndex: 0, bPlayerIndex: 1 };
    }
    if (swappedAssignmentScore > directAssignmentScore) {
      return { aPlayerIndex: 1, bPlayerIndex: 0 };
    }

    if (p0ToA > p0ToB) {
      return { aPlayerIndex: 0, bPlayerIndex: 1 };
    }
    if (p0ToB > p0ToA) {
      return { aPlayerIndex: 1, bPlayerIndex: 0 };
    }
    if (p1ToA > p1ToB) {
      return { aPlayerIndex: 1, bPlayerIndex: 0 };
    }
    if (p1ToB > p1ToA) {
      return { aPlayerIndex: 0, bPlayerIndex: 1 };
    }

    return null;
  }

  private getSideDraftFormes(team: DraftPokemon[]): Set<PokemonId> {
    return new Set(
      team.flatMap((pokemon) => this.getPokemonDraftFormes(pokemon)),
    );
  }

  private getPokemonDraftFormes(pokemon: DraftPokemon): PokemonId[] {
    const formeCandidates = [
      pokemon.id,
      ...(pokemon.draftFormes?.map((forme) => forme.id) ?? []),
    ];
    return formeCandidates.filter((id): id is PokemonId => !!id);
  }

  private countFormeMatches(
    replayPlayer: ReplayAnalysis['players'][number],
    draftFormes: Set<PokemonId>,
  ): number {
    const replayFormes = this.getSideDraftFormes(replayPlayer.team);
    let matches = 0;
    draftFormes.forEach((draftForme) => {
      const foundMatch = [...replayFormes].some((replayForme) =>
        draftForme.startsWith(replayForme),
      );
      if (foundMatch) {
        matches++;
      }
    });
    return matches;
  }

  private getTeamArray(
    matchForm: FormGroup,
    side: 'aTeam' | 'bTeam',
  ): FormArray {
    return matchForm.get(`${side}.team`) as FormArray;
  }

  private resetTeamStats(teamArray: FormArray): void {
    teamArray.controls.forEach((control) => {
      control.patchValue(
        {
          brought: 0,
          kills: 0,
          indirect: 0,
          fainted: 0,
        },
        { emitEvent: false },
      );
    });
  }

  private applyReplayStats(
    teamArray: FormArray,
    replayTeam: ReplayAnalysis['players'][number]['team'],
  ): void {
    replayTeam.forEach((replayMon) => {
      const teamControl = teamArray.controls.find((control) => {
        const draftMon = control.get('pokemon')?.value as
          | DraftPokemon
          | undefined;
        if (!draftMon) {
          return false;
        }
        const draftFormes = this.getPokemonDraftFormes(draftMon);
        console.log(replayMon.id, replayMon.formes);
        return (
          draftFormes.includes(replayMon.id) ||
          replayMon.formes?.some((replayForme) =>
            draftFormes.some((draftForme) => draftForme === replayForme),
          )
        );
      });

      if (!teamControl) {
        return;
      }

      teamControl.patchValue(
        {
          brought:
            replayMon.status === 'survived' || replayMon.status === 'fainted'
              ? 1
              : 0,
          kills: replayMon.kills.direct,
          indirect: replayMon.kills.indirect,
          fainted: replayMon.status === 'fainted' ? 1 : 0,
        },
        { emitEvent: false },
      );
    });
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
    return (
      this.statCount(this.aTeamArray, ['brought']) !==
      this.statCount(this.bTeamArray, ['brought'])
    );
  }

  aKillCaution() {
    return (
      this.statCount(this.aTeamArray, ['kills', 'indirect']) !==
      this.statCount(this.bTeamArray, ['fainted'])
    );
  }

  bKillCaution() {
    return (
      this.statCount(this.bTeamArray, ['kills', 'indirect']) !==
      this.statCount(this.aTeamArray, ['fainted'])
    );
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
