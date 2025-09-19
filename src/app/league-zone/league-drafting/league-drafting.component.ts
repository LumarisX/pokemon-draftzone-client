import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import {
  LeaguePokemon,
  LeagueTeam,
  LeagueZoneService,
} from '../../services/leagues/league-zone.service';
import { NumberSuffixPipe } from '../../util/pipes/number-suffix.pipe';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
    NumberSuffixPipe,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftingComponent implements OnInit, OnDestroy {
  draftOrder!: {
    teamName: string;
    pokemon?: Pokemon;
    skipTime?: Date;
  }[][];

  teams: LeagueTeam[] = [];
  canDraftTeams: string[] = [];
  selectedTeam!: LeagueTeam;
  private picksChanged = new Subject<void>();
  private picksSubscription!: Subscription;

  leagueName: string = '';
  divisionName: string = '';

  leagueId = 'pdbls2';
  teamId = '68c44121b0a184364eb03db9'; // Example ID, replace with actual logic later
  divisionId = '68c5a1c6f1ac9b585a542b86';

  currentPick: {
    round: number;
    position: number;
  } = {
    round: 0,
    position: 0,
  };

  selectedPick: number = 0;

  isDropdownOpen: boolean = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTeamAndClose(team: LeagueTeam) {
    this.selectedTeam = team;
    this.isDropdownOpen = false;
  }

  leagueService = inject(LeagueZoneService);
  ngOnInit(): void {
    this.leagueService.getDraftingDetails().subscribe((data) => {
      console.log(data);
      this.draftOrder = data.order;
      this.teams = data.teams;
      this.selectedTeam = this.teams[0];
      this.leagueName = data.leagueName;
      this.divisionName = data.divisionName;
      this.currentPick = data.currentPick;
      this.canDraftTeams = data.canDraft;
      console.log(this.currentPick);
      this.picksSubscription = this.picksChanged
        .pipe(debounceTime(5000))
        .subscribe(() => {
          console.log(this.selectedTeam.picks);
          this.leagueService
            .setPicks(
              this.teamId,
              this.selectedTeam.picks.map((round) =>
                round.map((pick) => pick.id),
              ),
            )
            .subscribe((response) => {
              console.log(response);
            });
        });
    });
  }

  ngOnDestroy(): void {
    this.picksSubscription.unsubscribe();
  }

  moveUp(picks: LeaguePokemon[], index: number) {
    if (!index || index >= picks.length) return;
    const temp = picks[index];
    picks[index] = picks[index - 1];
    picks[index - 1] = temp;
    this.picksChanged.next();
  }

  pokemonSelected(pokemon: TierPokemon & { tier: string }) {
    if (this.canDraft()) {
      this.draftPokemon(pokemon);
    } else {
      this.addChoice(pokemon);
    }
  }

  draftPokemon(pokemon: Pokemon) {
    this.leagueService
      .draftPokemon(this.selectedTeam.id, pokemon)
      .subscribe((response) => {
        console.log(response);
      });
  }

  deleteChoice(picks: LeaguePokemon[], index: number) {
    picks.splice(index, 1);
    this.picksChanged.next();
  }

  addChoice(pokemon: TierPokemon & { tier: string }) {
    this.selectedTeam.picks[this.selectedPick].push({
      name: pokemon.name,
      id: pokemon.id,
      tier: pokemon.tier,
    });
    this.picksChanged.next();
  }

  timeUntil(time: Date | string | undefined): string | null {
    if (!time) return null;
    const targetTime = new Date(time);
    const now = new Date();
    const diffMs = targetTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return '0m'; // Or some other indicator for past/current time
    }

    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const diffHours = diffMs / (1000 * 60 * 60);
      return `${diffHours.toFixed(1)}h`;
    }
  }
  buttonText() {
    if (!this.selectedTeam.picks.length) return undefined;
    if (this.canDraft()) return 'Draft';
    return (
      'Add to Picks \(' +
      (this.selectedPick + this.selectedTeam.draft.length + 1) +
      '\)'
    );
  }

  setRound(position: number): {
    number: number;
    team?: LeagueTeam;
  } {
    console.log(
      position,
      this.draftOrder.length,
      this.teams.length,
      Math.floor(position / this.teams.length),
      position % this.teams.length,
    );
    const teamName =
      this.draftOrder[Math.floor(position / this.teams.length)][
        position % this.teams.length
      ].teamName;
    const team = this.teams.find((team) => team.name === teamName);
    return {
      number: position,
      team,
    };
  }

  canDraft(): boolean {
    return this.canDraftTeams.includes(this.selectedTeam.id);
  }
}
