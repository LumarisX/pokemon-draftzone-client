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
import { LoadingComponent } from '../../images/loading/loading.component';
import { LeagueNotificationsComponent } from '../league-notifications/league-notifications.component';
import { LeagueNotificationService } from '../../services/league-notification.service';
import { WebSocketService } from '../../services/ws.service';

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
    NumberSuffixPipe,
    LoadingComponent,
    LeagueNotificationsComponent,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftComponent implements OnInit, OnDestroy {
  private notificationService = inject(LeagueNotificationService);
  private webSocketService = inject(WebSocketService);

  teams: LeagueTeam[] = [];
  canDraftTeams: string[] = [];
  selectedTeam!: LeagueTeam;
  private picksChanged = new Subject<void>();
  private picksSubscription!: Subscription;

  leagueName: string = '';
  divisionName: string = '';
  points: number = 0;

  isLoading: boolean = true;

  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };

  selectedPick: number = 0;

  isDropdownOpen: boolean = false;

  skipTimeDisplay: string | null = null;
  private countdownInterval: any;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTeamAndClose(team: LeagueTeam) {
    this.selectedTeam = team;
    this.isDropdownOpen = false;
  }
  draftDetails: {
    draftStyle: 'snake' | 'linear';
    roundCount: number;
    teamOrder: string[];
    status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  } = {
    draftStyle: 'snake',
    roundCount: 0,
    teamOrder: [],
    status: 'IN_PROGRESS',
  };

  get teamsMap() {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  get draftRounds() {
    const orderedTeams = this.draftDetails.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team) => team !== undefined);
    return Array.from({ length: this.draftDetails.roundCount }, (_, i) => {
      const round = [...orderedTeams];
      if (this.draftDetails.draftStyle === 'snake' && i % 2 === 1) {
        round.reverse();
      }
      return round;
    });
  }

  leagueService = inject(LeagueZoneService);
  ngOnInit(): void {
    this.leagueService.getDivisionDetails().subscribe((data) => {
      this.teams = data.teams;
      this.selectedTeam = this.teams[0];
      this.leagueName = data.leagueName;
      this.divisionName = data.divisionName;
      this.currentPick = data.currentPick;
      this.canDraftTeams = data.canDraft;
      this.isLoading = false;
      this.draftDetails.draftStyle = data.draftStyle;
      this.points = data.points;
      this.draftDetails.roundCount = data.rounds;
      this.draftDetails.teamOrder = data.teamOrder;
      this.draftDetails.status = data.status;
      this.picksSubscription = this.picksChanged
        .pipe(debounceTime(3000))
        .subscribe(() => {
          console.log(this.selectedTeam.picks);
          this.leagueService
            .setPicks(
              this.selectedTeam.id,
              this.selectedTeam.picks.map((round) =>
                round.map((pick) => pick.id),
              ),
            )
            .subscribe((response) => {
              console.log(response);
            });
        });

      this.startCountdown();
    });

    this.webSocketService
      .on<{
        pick: {
          divisionKey: string;
          pokemon: LeaguePokemon;
        };
        team: {
          id: string;
          name: string;
          draft: LeaguePokemon[];
        };
        canDraftTeams: string[];
      }>('league.draft.added')
      .subscribe((data) => {
        const team = this.teams.find((team) => team.id === data.team.id)!;
        team.draft = data.team.draft;
        this.teams = this.teams.map((team) => ({
          ...team,
          picks: team.picks.map((round) =>
            round.filter((pick) => pick.id !== data.pick.pokemon.id),
          ),
        }));
        this.canDraftTeams = data.canDraftTeams;
        this.notificationService.show(
          `${data.team.name} drafted ${data.pick.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<{
        currentPick: {
          round: number;
          position: number;
          skipTime?: Date;
        };
        canDraftTeams: string[];
        nextTeam: string;
      }>('league.draft.counter')
      .subscribe((data) => {
        console.log(data);
        this.currentPick = data.currentPick;
        this.canDraftTeams = data.canDraftTeams;
        this.startCountdown();
        this.notificationService.show(
          `Now drafting: ${this.teamsMap.get(data.nextTeam)?.name}`,
          'info',
        );
      });

    this.webSocketService
      .on<{
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
        currentPick?: {
          round: number;
          position: number;
          skipTime?: Date;
        };
      }>('league.draft.status')
      .subscribe((data) => {
        this.draftDetails.status = data.status;
        this.currentPick = data.currentPick;
        switch (data.status) {
          case 'PAUSED':
          case 'COMPLETED':
            clearInterval(this.countdownInterval);
            break;
          case 'IN_PROGRESS':
            this.startCountdown();
            break;
        }
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });

    this.webSocketService
      .on<{
        teamName: string;
      }>('league.draft.skip')
      .subscribe((data) => {
        this.notificationService.show(`${data.teamName} was skipped!`, 'info');
      });
  }

  ngOnDestroy(): void {
    this.picksSubscription.unsubscribe();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.skipTimeDisplay = this.timeUntil(this.currentPick?.skipTime);
    }, 1000);
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
    this.canDraftTeams = [];
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
      return '0s';
    }

    const diffSeconds = diffMs / 1000;
    if (diffSeconds < 300) {
      return `${Math.floor(diffSeconds)}s`;
    }

    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes < 60) {
      return `${diffMinutes.toFixed(0)}m`;
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(1)}h`;
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

  // setRound(position: number): {
  //   number: number;
  //   team?: LeagueTeam;
  // } {
  //   console.log(
  //     position,
  //     this.draftDetails.roundCount,
  //     this.teams.length,
  //     Math.floor(position / this.teams.length),
  //     position % this.teams.length,
  //   );
  //   const teamName =
  //     this.draftOrder[Math.floor(position / this.teams.length)][
  //       position % this.teams.length
  //     ].teamName;
  //   const team = this.teams.find((team) => team.name === teamName);
  //   return {
  //     number: position,
  //     team,
  //   };
  // }

  canDraft(): boolean {
    return (
      this.selectedTeam.isCoach &&
      this.canDraftTeams.includes(this.selectedTeam.id)
    );
  }
}
