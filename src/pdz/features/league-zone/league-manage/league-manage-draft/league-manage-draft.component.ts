import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { DataService } from '@pdz/core/services/data.service';
import { DraftPokemon } from '../../../drafts/draft.model';
import { PokemonSearchComponent } from '../../../drafts/draft-overview/draft-form/components/pokemon-search/pokemon-search.component';
import { LeagueNotificationService } from '../../league-notification.service';
import { LeagueManageService } from '../league-manage.service';
import { LeagueZoneService } from '../../league-zone.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueNotificationsComponent } from '../../league-notifications/league-notifications.component';
import { League } from '../../league.interface';

interface DraftCounterEvent {
  draftId: string;
  currentPick: {
    round: number;
    position: number;
  };
  nextTeam: string;
}

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [
    PokemonSearchComponent,
    SpriteComponent,
    IconComponent,
    LeagueNotificationsComponent,
  ],
  templateUrl: './league-manage-draft.component.html',
  styleUrl: './league-manage-draft.component.scss',
})
export class LeagueManageDraftComponent implements OnInit, OnDestroy {
  leagueManageService = inject(LeagueManageService);
  leagueZoneService = inject(LeagueZoneService);
  webSocketService = inject(WebSocketService);
  private notificationService = inject(LeagueNotificationService);
  private dataService = inject(DataService);

  private destroy$ = new Subject<void>();

  teams: League.LeagueTeam[] = [];
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' = 'IN_PROGRESS';
  noTimer = false;
  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);

  sequentialTurns = false;
  orderProgression: 'snake' | 'linear' = 'snake';
  roundCount = 0;
  teamOrder: string[] = [];
  currentPick?: { round: number; position: number };

  get teamsMap(): Map<string, League.LeagueTeam> {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  get draftRounds(): League.LeagueTeam[][] {
    const orderedTeams = this.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    return Array.from({ length: this.roundCount }, (_, i) => {
      const round = [...orderedTeams];
      if (this.orderProgression === 'snake' && i % 2 === 1) {
        round.reverse();
      }
      return round;
    });
  }

  ngOnInit(): void {
    this.dataService
      .getPokemonList('Gen9 NatDex')
      .subscribe((list) => this.pokemonList$.next(list));

    this.leagueZoneService
      .getDraftDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.teams = data.teams;
        this.status = data.status;
        this.noTimer = data.noTimer;
        this.sequentialTurns = data.sequentialTurns;
        this.orderProgression = data.orderProgression;
        this.roundCount = data.rounds;
        this.teamOrder = data.teamOrder;
        this.currentPick = data.currentPick;
      });

    this.webSocketService
      .on<{
        draftId: string;
        pick: { pokemon: League.LeaguePokemon };
        team: { id: string; name: string; draft: League.LeaguePokemon[] };
      }>('league.draft.added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftKey() !== data.draftId) return;

        const team = this.teams.find((team) => team.id === data.team.id);
        if (team) team.draft = data.team.draft;
        this.notificationService.show(
          `${data.team.name} drafted ${data.pick.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<DraftCounterEvent>('league.draft.counter')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftKey() !== data.draftId) return;

        this.currentPick = data.currentPick;
      });

    this.webSocketService
      .on<{
        draftId: string;
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
        noTimer?: boolean;
        currentPick?: { round: number; position: number };
      }>('league.draft.status')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftKey() !== data.draftId) return;

        this.status = data.status;
        if (data.noTimer !== undefined) this.noTimer = data.noTimer;
        if (data.currentPick) this.currentPick = data.currentPick;
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  takenIds(team: League.LeagueTeam): string[] {
    return team.draft.map((pokemon) => pokemon.id);
  }

  roundsPicked(team: League.LeagueTeam): number {
    return Math.min(team.draft.length, this.roundCount);
  }

  setState(state: string): void {
    this.leagueManageService.setDraftState(state).subscribe();
  }

  toggleNoTimer(): void {
    const noTimer = !this.noTimer;
    this.leagueManageService
      .setNoTimer(noTimer)
      .subscribe(() => (this.noTimer = noTimer));
  }

  addDraftPick(team: League.LeagueTeam, pokemon: DraftPokemon): void {
    this.leagueManageService
      .setPick(this.leagueZoneService.tournamentKey()!, {
        teamId: team.id,
        pokemonId: pokemon.id,
      })
      .subscribe();
  }

  skipNext() {
    this.leagueManageService.skipCurrentPick().subscribe();
  }
}
