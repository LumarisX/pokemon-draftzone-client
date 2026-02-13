import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { DraftPokemon } from '../../interfaces/draft';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import { LeagueNotificationService } from '../../services/league-notification.service';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { WebSocketService } from '../../services/ws.service';
import { NumberSuffixPipe } from '../../util/pipes/number-suffix.pipe';
import { LeagueNotificationsComponent } from '../league-notifications/league-notifications.component';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';
import { League } from '../league.interface';

interface DraftAddedEvent {
  divisionId: string;
  pick: {
    pokemon: League.LeaguePokemon;
  };
  team: {
    id: string;
    name: string;
    draft: League.LeaguePokemon[];
  };
  canDraftTeams: string[];
}

interface DraftCounterEvent {
  divisionId: string;
  currentPick: {
    round: number;
    position: number;
    skipTime?: Date;
  };
  canDraftTeams: string[];
  nextTeam: string;
}

interface DraftStatusEvent {
  divisionId: string;
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };
}

interface DraftSkipEvent {
  divisionId: string;
  teamName: string;
}

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
    NumberSuffixPipe,
    LoadingComponent,
    RouterModule,
    LeagueNotificationsComponent,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftComponent implements OnInit, OnDestroy {
  private notificationService = inject(LeagueNotificationService);
  private webSocketService = inject(WebSocketService);
  private leagueService = inject(LeagueZoneService);

  private destroy$ = new Subject<void>();
  private countdownTick$ = new Subject<void>();
  private picksChanged$ = new Subject<void>();

  teams: League.LeagueTeam[] = [];
  canDraftTeams: string[] = [];
  selectedTeam!: League.LeagueTeam;

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

  // Configuration constants
  private readonly PICKS_SAVE_DELAY_MS = 3000;
  private readonly COUNTDOWN_TICK_MS = 1000;
  private readonly FAST_TIME_THRESHOLD_MS = 300; // seconds

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTeamAndClose(team: League.LeagueTeam): void {
    this.selectedTeam = team;
    this.isDropdownOpen = false;
  }

  get teamsMap(): Map<string, League.LeagueTeam> {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  get draftRounds(): League.LeagueTeam[][] {
    const orderedTeams = this.draftDetails.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    return Array.from({ length: this.draftDetails.roundCount }, (_, i) => {
      const round = [...orderedTeams];
      if (this.draftDetails.draftStyle === 'snake' && i % 2 === 1) {
        round.reverse();
      }
      return round;
    });
  }

  ngOnInit(): void {
    this.leagueService
      .getDivisionDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
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

        this.picksChanged$
          .pipe(
            debounceTime(this.PICKS_SAVE_DELAY_MS),
            takeUntil(this.destroy$),
          )
          .subscribe(() => {
            this.leagueService
              .setPicks(
                this.selectedTeam.id,
                this.selectedTeam.picks.map((round) =>
                  round.map((pick) => ({ pokemonId: pick.id })),
                ),
              )
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          });

        this.startCountdown();
      });

    this.webSocketService
      .on<DraftAddedEvent>('league.draft.added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.divisionKey() !== data.divisionId) {
          return;
        }
        this.teams = this.teams.map((team) => {
          const newTeam = { ...team };
          if (team.id === data.team.id) {
            newTeam.draft = data.team.draft;
            newTeam.picks = newTeam.picks.filter((_, index) => index);
          }
          newTeam.picks = newTeam.picks.map((round) =>
            round.filter((pick) => pick.id !== data.pick.pokemon.id),
          );
          return newTeam;
        });

        if (this.selectedTeam) {
          const updatedSelectedTeam = this.teams.find(
            (t) => t.id === this.selectedTeam.id,
          );

          if (updatedSelectedTeam) {
            updatedSelectedTeam.pointTotal = data.team.draft.reduce(
              (points, p) => points + Number(p.tier),
              0,
            );
            Object.assign(this.selectedTeam, updatedSelectedTeam);
          }
        }

        this.canDraftTeams = data.canDraftTeams;
        this.notificationService.show(
          `${data.team.name} drafted ${data.pick.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<DraftCounterEvent>('league.draft.counter')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.divisionKey() !== data.divisionId) {
          return;
        }
        this.currentPick = data.currentPick;
        this.canDraftTeams = data.canDraftTeams;
        this.startCountdown();
        this.notificationService.show(
          `Now drafting: ${this.teamsMap.get(data.nextTeam)?.name}`,
          'info',
        );
      });

    this.webSocketService
      .on<DraftStatusEvent>('league.draft.status')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.divisionKey() !== data.divisionId) {
          return;
        }
        this.draftDetails.status = data.status;
        this.currentPick = data.currentPick;
        switch (data.status) {
          case 'PAUSED':
          case 'COMPLETED':
            this.countdownTick$.next();
            break;
          case 'IN_PROGRESS':
            this.startCountdown();
            break;
        }
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });

    this.webSocketService
      .on<DraftSkipEvent>('league.draft.skip')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.divisionKey() !== data.divisionId) {
          return;
        }
        this.notificationService.show(`${data.teamName} was skipped!`, 'info');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.countdownTick$.next();
    this.countdownTick$.complete();
  }

  startCountdown(): void {
    this.countdownTick$.next();
    interval(this.COUNTDOWN_TICK_MS)
      .pipe(takeUntil(this.countdownTick$))
      .subscribe(() => {
        this.skipTimeDisplay = this.timeUntil(this.currentPick?.skipTime);
      });
  }

  moveUp(picks: League.LeaguePokemon[], index: number): void {
    if (!index || index >= picks.length) return;
    const newPicks = [...picks];
    const temp = newPicks[index];
    newPicks[index] = newPicks[index - 1];
    newPicks[index - 1] = temp;
    picks.splice(0, picks.length, ...newPicks);
    this.picksChanged$.next();
  }

  pokemonSelected(pokemon: TierPokemon & { tier: string }): void {
    if (this.canDraft() && !this.selectedPick) {
      this.draftPokemon(pokemon);
    } else {
      this.addChoice(pokemon);
    }
  }

  draftPokemon(pokemon: DraftPokemon): void {
    this.canDraftTeams = [];
    this.leagueService
      .draftPokemon(this.selectedTeam.id, { pokemonId: pokemon.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  deleteChoice(picks: League.LeaguePokemon[], index: number): void {
    const newPicks = picks.filter((_, i) => i !== index);
    picks.splice(0, picks.length, ...newPicks);
    this.picksChanged$.next();
  }

  addChoice(pokemon: TierPokemon & { tier: string }): void {
    this.selectedTeam.picks[this.selectedPick].push({
      name: pokemon.name,
      id: pokemon.id,
      tier: pokemon.tier,
    });
    this.picksChanged$.next();
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
    if (diffSeconds < this.FAST_TIME_THRESHOLD_MS) {
      return `${Math.floor(diffSeconds)}s`;
    }

    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes < 60) {
      return `${diffMinutes.toFixed(0)}m`;
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(1)}h`;
  }

  buttonText(): string | undefined {
    if (!this.selectedTeam.picks.length) return undefined;
    if (this.canDraft() && !this.selectedPick) return 'Draft';
    return (
      'Add to Picks (' +
      (this.selectedPick + this.selectedTeam.draft.length + 1) +
      ')'
    );
  }

  altButtonText(): string | undefined {
    if (!this.selectedTeam.picks.length) return undefined;
    if (this.canDraft() && !this.selectedPick) return 'Draft Tera Capt.';
    return (
      'Add as Tera Capt. (' +
      (this.selectedPick + this.selectedTeam.draft.length + 1) +
      ')'
    );
  }

  canDraft(): boolean {
    return (
      this.selectedTeam.isCoach &&
      this.canDraftTeams.includes(this.selectedTeam.id)
    );
  }
}
