import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DraftPokemon } from '../../../drafts/draft.model';
import { PokemonSearchComponent } from '../../../drafts/draft-overview/draft-form/components/pokemon-search/pokemon-search.component';
import { TierListService } from '../../../tier-lists/tier-list.service';
import { PokemonId } from '@pdz/shared/data/namedex';
import { LeagueNotificationService } from '../../league-notification.service';
import { DraftDetails, LeagueManageService } from '../league-manage.service';
import { LeagueZoneService } from '../../league-zone.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueNotificationsComponent } from '../../league-notifications/league-notifications.component';
import { League } from '../../league.interface';

interface DraftCounterEvent {
  draftSlug: string;
  currentPick: {
    round: number;
    position: number;
  };
  nextTeam: string;
}

/** One team's slot in one round — the unit this page is built out of. */
export interface DraftTurn {
  /** Stable identity for `track`, and the key the inline editor opens against. */
  key: string;
  round: number;
  position: number;
  team: League.LeagueTeam;
  pokemon?: League.LeaguePokemon;
  state: 'picked' | 'current' | 'skipped' | 'upcoming';
}

export interface DraftTurnRound {
  round: number;
  turns: DraftTurn[];
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
  private tierListService = inject(TierListService);

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

  /** `DraftTurn.key` of the turn whose pick editor is open, if any. */
  editingKey: string | null = null;
  /** `DraftTurn.key` of the turn with an in-flight set/clear request. */
  pendingKey: string | null = null;

  get teamsMap(): Map<string, League.LeagueTeam> {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  /** Every Pokemon already off the board, so the search can't offer a duplicate. */
  get draftedIds(): string[] {
    return this.teams.flatMap((team) => team.draft.map((pokemon) => pokemon.id));
  }

  private get orderedTeams(): League.LeagueTeam[] {
    const ordered = this.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    // Drafts seeded before teamOrder existed still have teams to lay out.
    return ordered.length ? ordered : this.teams;
  }

  get rounds(): DraftTurnRound[] {
    const teams = this.orderedTeams;
    return Array.from({ length: this.roundCount }, (_, round) => {
      const order = [...teams];
      if (this.orderProgression === 'snake' && round % 2 === 1) order.reverse();
      return {
        round,
        turns: order.map((team, position) => {
          const pokemon = team.draft[round];
          return {
            key: `${team.id}:${round}`,
            round,
            position,
            team,
            pokemon,
            state: this.turnState(round, position, pokemon),
          };
        }),
      };
    });
  }

  private turnState(
    round: number,
    position: number,
    pokemon?: League.LeaguePokemon,
  ): DraftTurn['state'] {
    if (pokemon) return 'picked';
    if (!this.sequentialTurns || !this.currentPick) return 'upcoming';

    const { round: currentRound, position: currentPosition } = this.currentPick;
    if (currentRound === round && currentPosition === position) return 'current';
    return currentRound > round ||
      (currentRound === round && currentPosition > position)
      ? 'skipped'
      : 'upcoming';
  }

  ngOnInit(): void {
    // The tier list — not the full dex — is the set of Pokemon an organizer is
    // allowed to put on a roster, and it's what the server validates against.
    this.tierListService
      .getTierList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tierList }) =>
          this.pokemonList$.next(
            tierList.flatMap((tier) =>
              tier.pokemon.map((pokemon) => ({
                id: pokemon.id as PokemonId,
                name: pokemon.name,
              })),
            ),
          ),
        error: () =>
          this.notificationService.show(
            'Could not load the tier list; picks cannot be set.',
            'error',
          ),
      });

    this.leagueZoneService
      .getDraftDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.applyDraftDetails(data));

    this.webSocketService
      .on<{
        draftSlug: string;
        pick: { pokemon: League.LeaguePokemon };
        team: { id: string; name: string; draft: League.LeaguePokemon[] };
      }>('league.draft.added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

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
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

        this.currentPick = data.currentPick;
      });

    this.webSocketService
      .on<{
        draftSlug: string;
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
        noTimer?: boolean;
        currentPick?: { round: number; position: number };
      }>('league.draft.status')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

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

  private applyDraftDetails(data: DraftDetails): void {
    this.teams = data.teams;
    this.status = data.status;
    this.noTimer = data.noTimer;
    this.sequentialTurns = data.sequentialTurns;
    this.orderProgression = data.orderProgression;
    this.roundCount = data.rounds;
    this.teamOrder = data.teamOrder;
    this.currentPick = data.currentPick;
  }

  /** Who to credit on a turn: the coach who owes the pick, or whoever made it. */
  turnCoach(turn: DraftTurn): string {
    return turn.pokemon?.picker || turn.team.coach || 'Unknown coach';
  }

  roundPickedCount(round: DraftTurnRound): number {
    return round.turns.filter((turn) => turn.pokemon).length;
  }

  /**
   * A roster has no gaps, so a turn is only settable once every earlier round
   * for that team is filled — the server rejects anything further out.
   */
  canSetTurn(turn: DraftTurn): boolean {
    return turn.round <= turn.team.draft.length;
  }

  isEditing(turn: DraftTurn): boolean {
    return this.editingKey === turn.key;
  }

  isPending(turn: DraftTurn): boolean {
    return this.pendingKey === turn.key;
  }

  startEdit(turn: DraftTurn): void {
    if (!this.canSetTurn(turn)) return;
    this.editingKey = turn.key;
  }

  cancelEdit(): void {
    this.editingKey = null;
  }

  setTurnPick(turn: DraftTurn, pokemon: DraftPokemon): void {
    if (!pokemon.id || this.pendingKey) return;
    this.pendingKey = turn.key;

    this.leagueManageService
      .setRoundPick(turn.team.id, turn.round, { pokemonId: pokemon.id })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.pendingKey = null)),
      )
      .subscribe({
        next: (data) => {
          this.applyDraftDetails(data);
          this.editingKey = null;
          this.notificationService.show(
            `Round ${turn.round + 1}: ${turn.team.name} set to ${pokemon.name}.`,
            'success',
          );
        },
        error: (error) =>
          this.notificationService.show(
            `Could not set ${pokemon.name} for ${turn.team.name}. ${this.errorReason(error) ?? ''}`.trim(),
            'error',
          ),
      });
  }

  clearTurnPick(turn: DraftTurn): void {
    const pokemon = turn.pokemon;
    if (!pokemon?.id || this.pendingKey) return;
    this.pendingKey = turn.key;

    this.leagueManageService
      .clearPick(turn.team.id, pokemon.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.pendingKey = null)),
      )
      .subscribe({
        next: (data) => {
          this.applyDraftDetails(data);
          this.editingKey = null;
          this.notificationService.show(
            `Cleared ${pokemon.name} from ${turn.team.name}.`,
            'success',
          );
        },
        error: (error) =>
          this.notificationService.show(
            `Could not clear ${pokemon.name} from ${turn.team.name}. ${this.errorReason(error) ?? ''}`.trim(),
            'error',
          ),
      });
  }

  /** Pulls the server's human-readable rejection reason out of a PDZError body. */
  private errorReason(error: unknown): string | undefined {
    const reason = (
      error as { error?: { error?: { details?: { reason?: unknown } } } }
    )?.error?.error?.details?.reason;
    return typeof reason === 'string' ? reason : undefined;
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

  skipNext() {
    this.leagueManageService.skipCurrentPick().subscribe();
  }
}
