import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LEAGUE_ZONE_MANAGE_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { LeagueNotificationService } from '@pdz/features/league-zone/league-notification.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { formatCountdown } from '@pdz/features/league-zone/league.util';
import { PoolSwitcherComponent } from '@pdz/features/league-zone/league-widgets/pool-switcher/pool-switcher.component';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  LeagueManageService,
  PoolDetails,
} from '@pdz/features/league-zone/league-manage/league-manage.service';

type DraftStatus = PoolDetails['status'];
type OrderProgression = 'snake' | 'linear';
type CurrentPick = { round: number; position: number; skipTime?: Date };

interface DraftCounterEvent {
  poolSlug: string;
  currentPick: CurrentPick;
  nextTeam: string;
}

interface DraftTeamEvent {
  poolSlug: string;
  team: { id: string; name: string; draft: League.LeaguePokemon[] };
}

interface DraftAddedEvent extends DraftTeamEvent {
  pick: { pokemon: League.LeaguePokemon };
}

interface DraftStatusEvent {
  poolSlug: string;
  status: DraftStatus;
  noTimer?: boolean;
  currentPick?: CurrentPick;
}

export interface DraftTurn {
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

interface DraftSettings {
  name: string;
  channelId: string;
  orderProgression: OrderProgression;
  sequentialTurns: boolean;
  picksVisibleTo: League.PicksVisibleTo;
  allowDuplicates: boolean;
  allowRemovals: boolean;
}

const STATUS_LABELS: Record<DraftStatus, string> = {
  PRE_DRAFT: 'Not started',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETED: 'Draft complete',
};

const STATUS_TONES: Record<DraftStatus, ChipTone> = {
  PRE_DRAFT: 'info',
  IN_PROGRESS: 'success',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
};

const COUNTDOWN_TICK_MS = 1000;

const EMPTY_SETTINGS: DraftSettings = {
  name: '',
  channelId: '',
  orderProgression: 'snake',
  sequentialTurns: false,
  picksVisibleTo: 'everyone',
  allowDuplicates: false,
  allowRemovals: false,
};

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [
    PokemonSearchComponent,
    PokemonComponent,
    ButtonComponent,
    IconComponent,
    TooltipDirective,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CardComponent,
    ChipComponent,
    CheckComponent,
    ChoiceDirective,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    PoolSwitcherComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './league-manage-draft.component.html',
  styleUrl: './league-manage-draft.component.scss',
})
export class LeagueManageDraftComponent implements OnInit {
  private leagueManageService = inject(LeagueManageService);
  private leagueZoneService = inject(LeagueZoneService);
  private eventStream = inject(EventStreamService);
  private notificationService = inject(LeagueNotificationService);
  private tierListService = inject(TierListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private countdownReset$ = new Subject<void>();

  readonly pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);

  readonly teams = signal<League.LeagueTeam[]>([]);
  readonly status = signal<DraftStatus>('IN_PROGRESS');
  readonly noTimer = signal(false);
  readonly roundCount = signal(0);
  readonly teamOrder = signal<string[]>([]);
  readonly currentPick = signal<CurrentPick | undefined>(undefined);
  readonly pickTimeDisplay = signal<string | null>(null);

  readonly useRandomSeeding = signal(true);
  readonly pendingUseRandomSeeding = linkedSignal(() =>
    this.useRandomSeeding(),
  );
  readonly pendingOrder = linkedSignal(() => [...this.teamOrder()]);
  readonly orderSaving = signal(false);

  readonly settings = signal<DraftSettings>(EMPTY_SETTINGS);
  readonly pending = linkedSignal(() => ({ ...this.settings() }));
  readonly settingsSaving = signal(false);
  readonly testingMessage = signal(false);

  readonly editingKey = signal<string | null>(null);
  readonly pendingKey = signal<string | null>(null);

  readonly poolSlug = computed(() => this.leagueZoneService.poolSlug());

  readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  readonly statusTone = computed(() => STATUS_TONES[this.status()]);

  readonly canEditOrder = computed(
    () => !['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(this.status()),
  );

  readonly canReorderTeams = computed(
    () => this.canEditOrder() && !this.pendingUseRandomSeeding(),
  );

  private readonly teamsById = computed(
    () => new Map(this.teams().map((team) => [team.id, team])),
  );

  private readonly orderedTeams = computed(() =>
    this.resolveOrder(this.teamOrder()),
  );

  readonly orderPreview = computed(() =>
    this.resolveOrder(
      this.pendingUseRandomSeeding() ? this.teamOrder() : this.pendingOrder(),
    ),
  );

  readonly isOrderDirty = computed(() => {
    if (this.pendingUseRandomSeeding() !== this.useRandomSeeding()) return true;
    if (this.pendingUseRandomSeeding()) return false;
    const pending = this.pendingOrder();
    const saved = this.teamOrder();
    return (
      pending.length !== saved.length ||
      pending.some((id, index) => id !== saved[index])
    );
  });

  readonly isSettingsDirty = computed(() => {
    const pending = this.pending();
    const saved = this.settings();
    return (Object.keys(saved) as (keyof DraftSettings)[]).some(
      (key) => pending[key] !== saved[key],
    );
  });

  readonly rounds = computed<DraftTurnRound[]>(() => {
    const teams = this.orderedTeams();
    const snake = this.settings().orderProgression === 'snake';
    return Array.from({ length: this.roundCount() }, (_, round) => {
      const order = [...teams];
      if (snake && round % 2 === 1) order.reverse();
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
  });

  readonly currentTurn = computed(() => {
    const pick = this.currentPick();
    if (!pick) return undefined;
    return this.rounds()[pick.round]?.turns.find(
      (turn) => turn.position === pick.position,
    );
  });

  ngOnInit(): void {
    this.tierListService
      .getTierList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tierList }) =>
          this.pokemonList$.next(
            tierList.flatMap((tier) =>
              tier.pokemon.map((pokemon) => ({
                id: pokemon.id,
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

    this.route.paramMap
      .pipe(
        map((params) => params.get('poolSlug')),
        distinctUntilChanged(),
        tap(() => this.resetPendingEdits()),
        switchMap((poolSlug) =>
          this.leagueZoneService.getPoolDetails(poolSlug ?? undefined),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.applyPoolDetails(data);
        this.startCountdown();
      });

    this.on<DraftAddedEvent>('league.draft.added').subscribe((data) => {
      this.replaceDraft(data.team);
      this.notificationService.show(
        `${data.team.name} drafted ${data.pick.pokemon.name}!`,
        'success',
      );
    });

    this.on<DraftTeamEvent>('league.draft.updated').subscribe((data) =>
      this.replaceDraft(data.team),
    );

    this.on<DraftCounterEvent>('league.draft.counter').subscribe((data) => {
      this.currentPick.set(data.currentPick);
      this.startCountdown();
    });

    this.on<DraftStatusEvent>('league.draft.status').subscribe((data) => {
      this.status.set(data.status);
      if (data.noTimer !== undefined) this.noTimer.set(data.noTimer);
      if (data.currentPick) this.currentPick.set(data.currentPick);
      this.startCountdown();
      this.notificationService.show(
        `Draft status: ${STATUS_LABELS[data.status] ?? data.status}`,
        'info',
      );
    });

    this.destroyRef.onDestroy(() => this.countdownReset$.next());
  }

  patch<K extends keyof DraftSettings>(key: K, value: DraftSettings[K]): void {
    this.pending.update((settings) => ({ ...settings, [key]: value }));
  }

  takenIdsFor(turn: DraftTurn): string[] {
    const teams = this.settings().allowDuplicates ? [turn.team] : this.teams();
    return teams.flatMap((team) => team.draft.map((pokemon) => pokemon.id));
  }

  turnCoach(turn: DraftTurn): string {
    return turn.pokemon?.picker || turn.team.coach || 'Unknown coach';
  }

  roundPickedCount(round: DraftTurnRound): number {
    return round.turns.filter((turn) => turn.pokemon).length;
  }

  canSetTurn(turn: DraftTurn): boolean {
    return turn.round <= turn.team.draft.length;
  }

  canMakeCurrent(turn: DraftTurn): boolean {
    return (
      this.settings().sequentialTurns &&
      !turn.pokemon &&
      turn.state !== 'current'
    );
  }

  isEditing(turn: DraftTurn): boolean {
    return this.editingKey() === turn.key;
  }

  isPending(turn: DraftTurn): boolean {
    return this.pendingKey() === turn.key;
  }

  startEdit(turn: DraftTurn): void {
    if (this.canSetTurn(turn)) this.editingKey.set(turn.key);
  }

  cancelEdit(): void {
    this.editingKey.set(null);
  }

  onPoolSelected(poolSlug: string): void {
    this.router.navigate([
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueZoneService.leagueSlug(),
      'tournaments',
      this.leagueZoneService.tournamentSlug(),
      LEAGUE_ZONE_MANAGE_PATH,
      'pools',
      poolSlug,
      'draft',
    ]);
  }

  setTurnPick(turn: DraftTurn, pokemon: DraftPokemon): void {
    if (!pokemon.id) return;
    this.runTurnAction(
      turn,
      this.leagueManageService.setRoundPick(turn.team.id, turn.round, {
        pokemonId: pokemon.id,
      }),
      `Round ${turn.round + 1}: ${turn.team.name} set to ${pokemon.name}.`,
      `Could not set ${pokemon.name} for ${turn.team.name}.`,
    );
  }

  clearTurnPick(turn: DraftTurn): void {
    const pokemon = turn.pokemon;
    if (!pokemon?.id) return;
    this.runTurnAction(
      turn,
      this.leagueManageService.clearPick(turn.team.id, pokemon.id),
      `Cleared ${pokemon.name} from ${turn.team.name}.`,
      `Could not clear ${pokemon.name} from ${turn.team.name}.`,
    );
  }

  makeCurrentTurn(turn: DraftTurn): void {
    if (!this.canMakeCurrent(turn)) return;
    this.runTurnAction(
      turn,
      this.leagueManageService.setCurrentPick(turn.round, turn.position),
      `Draft moved to round ${turn.round + 1}, pick ${turn.position + 1} (${turn.team.name}).`,
      `Could not move the draft to ${turn.team.name}'s turn.`,
    );
  }

  setState(state: 'play' | 'pause'): void {
    this.leagueManageService.setDraftState(state).subscribe();
  }

  toggleNoTimer(): void {
    const noTimer = !this.noTimer();
    this.leagueManageService
      .setNoTimer(noTimer)
      .subscribe(() => this.noTimer.set(noTimer));
  }

  skipNext(): void {
    this.leagueManageService.skipCurrentPick().subscribe();
  }

  toggleRandomSeeding(): void {
    if (!this.canEditOrder()) return;
    this.pendingUseRandomSeeding.update((value) => !value);
    if (!this.pendingUseRandomSeeding() && !this.pendingOrder().length) {
      this.pendingOrder.set(this.orderedTeams().map((team) => team.id));
    }
  }

  dropTeam(event: CdkDragDrop<League.LeagueTeam[]>): void {
    if (!this.canReorderTeams()) return;
    this.pendingOrder.update((order) => {
      const next = [...order];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  saveOrder(): void {
    if (!this.isOrderDirty() || this.orderSaving()) return;
    this.orderSaving.set(true);

    const useRandomSeeding = this.pendingUseRandomSeeding();
    this.leagueManageService
      .setDraftOrder({
        useRandomSeeding,
        order: useRandomSeeding ? undefined : this.pendingOrder(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.orderSaving.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.applyPoolDetails(data);
          this.notificationService.show('Draft order saved.', 'success');
        },
        error: (error) => this.showError('Could not save draft order.', error),
      });
  }

  saveSettings(): void {
    if (!this.isSettingsDirty() || this.settingsSaving()) return;
    this.settingsSaving.set(true);

    const pending = this.pending();
    const channelId = pending.channelId.trim();
    this.leagueManageService
      .updateDraftSettings({
        name: pending.name,
        channelId: channelId || null,
        picksVisibleTo: pending.picksVisibleTo,
        allowRemovals: pending.allowRemovals,
        ...(this.canEditOrder()
          ? {
              orderProgression: pending.orderProgression,
              sequentialTurns: pending.sequentialTurns,
              allowDuplicates: pending.allowDuplicates,
            }
          : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.settingsSaving.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.applyPoolDetails(data);
          this.notificationService.show('Draft settings saved.', 'success');
        },
        error: (error) =>
          this.showError('Could not save draft settings.', error),
      });
  }

  sendTestMessage(): void {
    if (!this.settings().channelId || this.testingMessage()) return;
    this.testingMessage.set(true);

    this.leagueManageService
      .sendTestMessage()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.testingMessage.set(false)),
      )
      .subscribe({
        next: (data) =>
          this.notificationService.show(
            data.delivered
              ? 'Test message sent — check the channel.'
              : "Couldn't deliver a test message. Check the channel ID and bot permissions.",
            data.delivered ? 'success' : 'error',
          ),
        error: (error) =>
          this.showError('Could not send a test message.', error),
      });
  }

  private on<T extends { poolSlug: string }>(event: string): Observable<T> {
    return this.eventStream.on<T>(event).pipe(
      filter((data) => this.leagueZoneService.poolSlug() === data.poolSlug),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private resolveOrder(ids: string[]): League.LeagueTeam[] {
    const byId = this.teamsById();
    const ordered = ids
      .map((teamId) => byId.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    return ordered.length ? ordered : this.teams();
  }

  private turnState(
    round: number,
    position: number,
    pokemon?: League.LeaguePokemon,
  ): DraftTurn['state'] {
    if (pokemon) return 'picked';
    const pick = this.currentPick();
    if (!this.settings().sequentialTurns || !pick) return 'upcoming';
    if (pick.round === round && pick.position === position) return 'current';
    return pick.round > round ||
      (pick.round === round && pick.position > position)
      ? 'skipped'
      : 'upcoming';
  }

  private replaceDraft(team: DraftTeamEvent['team']): void {
    this.teams.update((teams) =>
      teams.map((entry) =>
        entry.id === team.id ? { ...entry, draft: team.draft } : entry,
      ),
    );
  }

  private runTurnAction(
    turn: DraftTurn,
    request: Observable<PoolDetails>,
    success: string,
    failure: string,
  ): void {
    if (this.pendingKey()) return;
    this.pendingKey.set(turn.key);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingKey.set(null)),
      )
      .subscribe({
        next: (data) => {
          this.applyPoolDetails(data);
          this.editingKey.set(null);
          this.notificationService.show(success, 'success');
        },
        error: (error) => this.showError(failure, error),
      });
  }

  private startCountdown(): void {
    this.countdownReset$.next();
    this.updatePickTimeDisplay();
    if (!this.currentPick()?.skipTime) return;

    interval(COUNTDOWN_TICK_MS)
      .pipe(
        takeUntil(this.countdownReset$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updatePickTimeDisplay());
  }

  private updatePickTimeDisplay(): void {
    const skipTime = this.currentPick()?.skipTime;
    if (!skipTime) {
      this.pickTimeDisplay.set(null);
      return;
    }
    const diffMs = new Date(skipTime).getTime() - Date.now();
    this.pickTimeDisplay.set(diffMs > 0 ? formatCountdown(diffMs) : '0s');
  }

  private resetPendingEdits(): void {
    this.editingKey.set(null);
    this.pendingKey.set(null);
    this.orderSaving.set(false);
    this.settingsSaving.set(false);
    this.testingMessage.set(false);
  }

  private applyPoolDetails(data: PoolDetails): void {
    this.teams.set(data.teams);
    this.status.set(data.status);
    this.noTimer.set(data.noTimer);
    this.roundCount.set(data.rounds);
    this.teamOrder.set(data.teamOrder);
    this.currentPick.set(data.currentPick);
    this.useRandomSeeding.set(data.useRandomSeeding);
    this.settings.set({
      name: data.poolName,
      channelId: data.channelId ?? '',
      orderProgression: data.orderProgression,
      sequentialTurns: data.sequentialTurns,
      picksVisibleTo: data.picksVisibleTo,
      allowDuplicates: data.allowDuplicates,
      allowRemovals: data.allowRemovals,
    });
  }

  private showError(message: string, error: unknown): void {
    const reason = apiErrorMessage(error, '');
    this.notificationService.show(
      reason ? `${message} ${reason}` : message,
      'error',
    );
  }
}
