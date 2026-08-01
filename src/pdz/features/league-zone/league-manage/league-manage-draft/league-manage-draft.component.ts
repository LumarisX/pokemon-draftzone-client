import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, interval, Subject, takeUntil } from 'rxjs';
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
import { formatCountdown } from '../../league.util';

interface DraftCounterEvent {
  draftSlug: string;
  currentPick: {
    round: number;
    position: number;
    skipTime?: Date;
  };
  nextTeam: string;
}

/** An organizer edited a roster slot out of band — set, swapped, or cleared. */
interface DraftPickUpdatedEvent {
  draftSlug: string;
  round?: number;
  /** Absent when the slot was cleared rather than set. */
  pokemon?: League.LeaguePokemon;
  previous?: League.LeaguePokemon;
  team: { id: string; name: string; draft: League.LeaguePokemon[] };
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
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
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
  private countdownTick$ = new Subject<void>();
  private readonly COUNTDOWN_TICK_MS = 1000;

  teams: League.LeagueTeam[] = [];
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' = 'IN_PROGRESS';
  noTimer = false;
  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);

  sequentialTurns = false;
  orderProgression: 'snake' | 'linear' = 'snake';
  roundCount = 0;
  teamOrder: string[] = [];
  currentPick?: { round: number; position: number; skipTime?: Date };
  /** Live "time left on the clock" text for currentPick, ticking every second. */
  pickTimeDisplay: string | null = null;

  /** Last-saved seeding config, from the server. */
  useRandomSeeding = true;
  /** Organizer's in-progress edit, staged until Save is pressed. */
  pendingUseRandomSeeding = true;
  pendingOrder: string[] = [];
  orderSaving = false;

  /** Last-saved draft metadata, from the server. */
  draftName = '';
  channelId?: string;
  visibility: 'ALL' | 'SELF' = 'ALL';
  allowRemovals = false;

  /** Organizer's in-progress settings edit, staged until Save is pressed. */
  pendingDraftName = '';
  pendingChannelId = '';
  pendingOrderProgression: 'snake' | 'linear' = 'snake';
  pendingSequentialTurns = false;
  pendingVisibility: 'ALL' | 'SELF' = 'ALL';
  pendingAllowRemovals = false;
  settingsSaving = false;
  testingMessage = false;

  /** `DraftTurn.key` of the turn whose pick editor is open, if any. */
  editingKey: string | null = null;
  /** `DraftTurn.key` of the turn with an in-flight set/clear request. */
  pendingKey: string | null = null;

  get teamsMap(): Map<string, League.LeagueTeam> {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  /** Every Pokemon already off the board, so the search can't offer a duplicate. */
  get draftedIds(): string[] {
    return this.teams.flatMap((team) =>
      team.draft.map((pokemon) => pokemon.id),
    );
  }

  private get orderedTeams(): League.LeagueTeam[] {
    const ordered = this.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    // Drafts seeded before teamOrder existed still have teams to lay out.
    return ordered.length ? ordered : this.teams;
  }

  /**
   * Reordering is only safe before any picks exist. Legacy drafts may carry
   * statuses like NOT_STARTED, so treat anything not active/finished as
   * pre-draft rather than checking for the literal 'PRE_DRAFT' string.
   */
  get canEditOrder(): boolean {
    return !['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(this.status);
  }

  get canReorderTeams(): boolean {
    return this.canEditOrder && !this.pendingUseRandomSeeding;
  }

  /** The list the order panel renders: staged edits while editing manually, else the saved order. */
  get orderPreview(): League.LeagueTeam[] {
    const ids = this.pendingUseRandomSeeding ? this.teamOrder : this.pendingOrder;
    const ordered = ids
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    return ordered.length ? ordered : this.teams;
  }

  get isOrderDirty(): boolean {
    if (this.pendingUseRandomSeeding !== this.useRandomSeeding) return true;
    if (this.pendingUseRandomSeeding) return false;
    return !this.sameOrder(this.pendingOrder, this.teamOrder);
  }

  private sameOrder(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
  }

  get isSettingsDirty(): boolean {
    return (
      this.pendingDraftName !== this.draftName ||
      this.pendingChannelId !== (this.channelId ?? '') ||
      this.pendingOrderProgression !== this.orderProgression ||
      this.pendingSequentialTurns !== this.sequentialTurns ||
      this.pendingVisibility !== this.visibility ||
      this.pendingAllowRemovals !== this.allowRemovals
    );
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

  /** The turn currently on the clock, if any — drives the header's status line. */
  get currentTurn(): DraftTurn | undefined {
    if (!this.currentPick) return undefined;
    return this.rounds[this.currentPick.round]?.turns.find(
      (turn) => turn.position === this.currentPick!.position,
    );
  }

  /** Short, human-readable summary of what the draft is doing right now. */
  get statusLabel(): string {
    switch (this.status) {
      case 'COMPLETED':
        return 'Draft complete';
      case 'PAUSED':
        return 'Paused';
      case 'IN_PROGRESS':
        return 'In progress';
      default:
        return 'Not started';
    }
  }

  private turnState(
    round: number,
    position: number,
    pokemon?: League.LeaguePokemon,
  ): DraftTurn['state'] {
    if (pokemon) return 'picked';
    if (!this.sequentialTurns || !this.currentPick) return 'upcoming';

    const { round: currentRound, position: currentPosition } = this.currentPick;
    if (currentRound === round && currentPosition === position)
      return 'current';
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
      .subscribe((data) => {
        this.applyDraftDetails(data);
        this.startCountdown();
      });

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

    // The acting organizer already gets a toast off their own request, so this
    // only keeps a second organizer's board in sync.
    this.webSocketService
      .on<DraftPickUpdatedEvent>('league.draft.updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

        const team = this.teams.find((team) => team.id === data.team.id);
        if (team) team.draft = data.team.draft;
      });

    this.webSocketService
      .on<DraftCounterEvent>('league.draft.counter')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

        this.currentPick = data.currentPick;
        this.startCountdown();
      });

    this.webSocketService
      .on<{
        draftSlug: string;
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
        noTimer?: boolean;
        currentPick?: { round: number; position: number; skipTime?: Date };
      }>('league.draft.status')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueZoneService.draftSlug() !== data.draftSlug) return;

        this.status = data.status;
        if (data.noTimer !== undefined) this.noTimer = data.noTimer;
        if (data.currentPick) this.currentPick = data.currentPick;
        this.startCountdown();
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.countdownTick$.next();
    this.countdownTick$.complete();
  }

  /** Restarts the 1s ticker so `pickTimeDisplay` tracks the latest `currentPick.skipTime`. */
  private startCountdown(): void {
    this.countdownTick$.next();
    this.updatePickTimeDisplay();
    if (!this.currentPick?.skipTime) return;

    interval(this.COUNTDOWN_TICK_MS)
      .pipe(takeUntil(this.countdownTick$), takeUntil(this.destroy$))
      .subscribe(() => this.updatePickTimeDisplay());
  }

  private updatePickTimeDisplay(): void {
    const skipTime = this.currentPick?.skipTime;
    if (!skipTime) {
      this.pickTimeDisplay = null;
      return;
    }
    const diffMs = new Date(skipTime).getTime() - Date.now();
    this.pickTimeDisplay = diffMs > 0 ? formatCountdown(diffMs) : '0s';
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

    this.useRandomSeeding = data.useRandomSeeding;
    this.pendingUseRandomSeeding = data.useRandomSeeding;
    this.pendingOrder = [...data.teamOrder];

    this.draftName = data.draftName;
    this.channelId = data.channelId;
    this.visibility = data.visibility;
    this.allowRemovals = data.allowRemovals;

    this.pendingDraftName = data.draftName;
    this.pendingChannelId = data.channelId ?? '';
    this.pendingOrderProgression = data.orderProgression;
    this.pendingSequentialTurns = data.sequentialTurns;
    this.pendingVisibility = data.visibility;
    this.pendingAllowRemovals = data.allowRemovals;
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

  /**
   * Only an empty slot can be handed back to its team — a turn that already has
   * a pick has nothing left to do, and the current turn is already there.
   */
  canMakeCurrent(turn: DraftTurn): boolean {
    return this.sequentialTurns && !turn.pokemon && turn.state !== 'current';
  }

  /** Rewinds (or jumps) the draft to this turn and restarts its clock. */
  makeCurrentTurn(turn: DraftTurn): void {
    if (!this.canMakeCurrent(turn) || this.pendingKey) return;
    this.pendingKey = turn.key;

    this.leagueManageService
      .setCurrentPick(turn.round, turn.position)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.pendingKey = null)),
      )
      .subscribe({
        next: (data) => {
          this.applyDraftDetails(data);
          this.editingKey = null;
          this.notificationService.show(
            `Draft moved to round ${turn.round + 1}, pick ${turn.position + 1} (${turn.team.name}).`,
            'success',
          );
        },
        error: (error) =>
          this.notificationService.show(
            `Could not move the draft to ${turn.team.name}'s turn. ${this.errorReason(error) ?? ''}`.trim(),
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

  toggleRandomSeeding(): void {
    if (!this.canEditOrder) return;
    this.pendingUseRandomSeeding = !this.pendingUseRandomSeeding;
    if (!this.pendingUseRandomSeeding && !this.pendingOrder.length) {
      // Seed the manual list from whatever's currently on screen (falls back
      // to team-join order when there's no saved teamOrder yet), so the
      // organizer edits from somewhere sensible rather than an empty list.
      this.pendingOrder = this.orderedTeams.map((team) => team.id);
    }
  }

  dropTeam(event: CdkDragDrop<League.LeagueTeam[]>): void {
    if (!this.canReorderTeams) return;
    moveItemInArray(this.pendingOrder, event.previousIndex, event.currentIndex);
  }

  saveOrder(): void {
    if (!this.isOrderDirty || this.orderSaving) return;
    this.orderSaving = true;

    this.leagueManageService
      .setDraftOrder({
        useRandomSeeding: this.pendingUseRandomSeeding,
        order: this.pendingUseRandomSeeding ? undefined : this.pendingOrder,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.orderSaving = false)),
      )
      .subscribe({
        next: (data) => {
          this.applyDraftDetails(data);
          this.notificationService.show('Draft order saved.', 'success');
        },
        error: (error) =>
          this.notificationService.show(
            `Could not save draft order. ${this.errorReason(error) ?? ''}`.trim(),
            'error',
          ),
      });
  }

  saveSettings(): void {
    if (!this.isSettingsDirty || this.settingsSaving) return;
    this.settingsSaving = true;

    this.leagueManageService
      .updateDraftSettings({
        name: this.pendingDraftName,
        channelId: this.pendingChannelId.trim()
          ? this.pendingChannelId.trim()
          : null,
        orderProgression: this.pendingOrderProgression,
        sequentialTurns: this.pendingSequentialTurns,
        visibility: this.pendingVisibility,
        allowRemovals: this.pendingAllowRemovals,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.settingsSaving = false)),
      )
      .subscribe({
        next: (data) => {
          this.applyDraftDetails(data);
          this.notificationService.show('Draft settings saved.', 'success');
        },
        error: (error) =>
          this.notificationService.show(
            `Could not save draft settings. ${this.errorReason(error) ?? ''}`.trim(),
            'error',
          ),
      });
  }

  /** Tests the *saved* channelId — save settings first if you just changed it. */
  sendTestMessage(): void {
    if (!this.channelId || this.testingMessage) return;
    this.testingMessage = true;

    this.leagueManageService
      .sendTestMessage()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.testingMessage = false)),
      )
      .subscribe({
        next: (data) =>
          this.notificationService.show(
            data.success
              ? 'Test message sent — check the channel.'
              : "Couldn't deliver a test message. Check the channel ID and bot permissions.",
            data.success ? 'success' : 'error',
          ),
        error: (error) =>
          this.notificationService.show(
            `Could not send a test message. ${this.errorReason(error) ?? ''}`.trim(),
            'error',
          ),
      });
  }
}
