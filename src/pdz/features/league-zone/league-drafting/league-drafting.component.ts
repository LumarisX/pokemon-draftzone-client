import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PLANNER_PATH } from '@pdz/core/route-paths';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { LeagueNotificationService } from '@pdz/features/league-zone/league-notification.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { formatCountdown } from '@pdz/features/league-zone/league.util';
import { TierListComponent } from '@pdz/features/tier-lists/tier-list/tier-list.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { NumberSuffixPipe } from '@pdz/shared/pipes/number-suffix.pipe';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface DraftAddedEvent {
  poolSlug: string;
  pick: {
    pokemon?: League.LeaguePokemon;
  };
  team: {
    id: string;
    name: string;
    draft: League.LeaguePokemon[];
  };
  canDraftCounts?: Record<string, number>;
}

interface DraftCounterEvent {
  poolSlug: string;
  currentPick: {
    round: number;
    position: number;
    skipTime?: Date;
  };
  canDraftCounts: Record<string, number>;
  nextTeam: string;
}

interface DraftPickUpdatedEvent {
  poolSlug: string;
  round?: number;
  pokemon?: League.LeaguePokemon;
  previous?: League.LeaguePokemon;
  team: {
    id: string;
    name: string;
    draft: League.LeaguePokemon[];
  };
  canDraftCounts?: Record<string, number>;
}

type DraftStatus = 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

interface DraftStatusEvent {
  poolSlug: string;
  status: DraftStatus;
  noTimer?: boolean;
  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };
}

interface DraftSkipEvent {
  poolSlug: string;
  teamName: string;
}

type DraftDetailsResponse =
  ReturnType<LeagueZoneService['getPoolDetails']> extends Observable<infer T>
    ? T
    : never;

type DraftChoice = {
  id: string;
  name: string;
  addons?: string[];
  tier: string;
  cost?: number;
};

const STATUS_LABELS: Record<DraftStatus, string> = {
  PRE_DRAFT: 'Pre draft',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
};

const STATUS_TONES: Record<DraftStatus, ChipTone> = {
  PRE_DRAFT: 'info',
  IN_PROGRESS: 'success',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
};

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    TierListComponent,
    SpriteComponent,
    IconComponent,
    NumberSuffixPipe,
    LoadingComponent,
    RouterLink,
    PokemonTypeComponent,
    ButtonComponent,
    ChipComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    PageHeaderComponent,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrl: './league-drafting.component.scss',
})
export class LeagueDraftComponent implements OnInit {
  private notificationService = inject(LeagueNotificationService);
  private eventStream = inject(EventStreamService);
  private leagueService = inject(LeagueZoneService);
  private destroyRef = inject(DestroyRef);

  private countdownTick$ = new Subject<void>();
  private halfwayReminderTimer?: ReturnType<typeof setTimeout>;
  private hasAutoScrolledToCurrentRound = false;
  private readonly SCROLL_RETRY_DELAY_MS = 50;
  private readonly SCROLL_MAX_ATTEMPTS = 10;

  readonly plannerPath = PLANNER_PATH;

  private readonly draftRoundsContainer =
    viewChild<ElementRef<HTMLDivElement>>('draftRoundsContainer');

  teams: League.LeagueTeam[] = [];
  canDraftCounts: Record<string, number> = {};
  selectedTeam!: League.LeagueTeam;

  private originalDraft: League.LeaguePokemon[] = [];
  private picksChanged = false;
  isSubmitting = false;

  leagueName = '';
  poolName = '';
  points = 0;
  minDraftCount = 0;
  tierRequirements: { tierId: string; tierName: string; required: number }[] =
    [];

  isLoading = true;

  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };

  selectedPick = 0;
  skipTimeDisplay: string | null = null;
  noTimer = false;
  draftStart?: Date;
  draftStartDisplay: string | null = null;
  draftStartOverdue = false;

  draftDetails: {
    orderProgression: 'snake' | 'linear';
    sequentialTurns: boolean;
    picksBlind: boolean;
    canSeeAllPicks: boolean;
    allowDuplicates: boolean;
    roundCount: number;
    teamOrder: string[];
    status: DraftStatus;
  } = {
    orderProgression: 'snake',
    sequentialTurns: true,
    picksBlind: false,
    canSeeAllPicks: false,
    allowDuplicates: false,
    roundCount: 0,
    teamOrder: [],
    status: 'IN_PROGRESS',
  };

  private readonly COUNTDOWN_TICK_MS = 1000;
  private readonly FAST_TIME_THRESHOLD_MS = 300;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.countdownTick$.next();
      this.countdownTick$.complete();
      this.clearHalfwayReminder();
    });
  }

  get statusLabel(): string {
    if (this.draftStartDisplay) return `Starting in ${this.draftStartDisplay}`;
    if (this.isPreDraft && this.draftStartOverdue)
      return 'Awaiting organizer to start the draft';
    return STATUS_LABELS[this.draftDetails.status] ?? this.draftDetails.status;
  }

  get statusTone(): ChipTone {
    return STATUS_TONES[this.draftDetails.status] ?? 'neutral';
  }

  get teamSwitchLocked(): boolean {
    return this.draftDetails.picksBlind && !this.draftDetails.canSeeAllPicks;
  }

  hiddenPickAt(team: League.LeagueTeam, round: number): boolean {
    return !!team.picksHidden && round < (team.pickCount ?? 0);
  }

  isPicking(roundIndex: number, position: number): boolean {
    return (
      !!this.currentPick &&
      this.currentPick.round === roundIndex &&
      this.currentPick.position === position
    );
  }

  pickState(
    team: League.LeagueTeam,
    roundIndex: number,
    position: number,
  ): 'drafted' | 'hidden' | 'picking' | 'skipped' | 'upcoming' {
    if (team.draft[roundIndex]) return 'drafted';
    if (this.hiddenPickAt(team, roundIndex)) return 'hidden';
    if (this.isPicking(roundIndex, position)) return 'picking';
    const pick = this.currentPick;
    if (
      pick &&
      (pick.round > roundIndex ||
        (pick.round === roundIndex && pick.position > position))
    )
      return 'skipped';
    return 'upcoming';
  }

  selectTeamAndClose(team: League.LeagueTeam): void {
    this.selectedTeam = team;
    this.originalDraft = [...team.draft];
    this.picksChanged = false;
  }

  get teamsMap(): Map<string, League.LeagueTeam> {
    return new Map(this.teams.map((team) => [team.id, team]));
  }

  get hasPendingChanges(): boolean {
    if (this.picksChanged) return true;
    const origIds = new Set(this.originalDraft.map((p) => p.id));
    const currIds = new Set(this.selectedTeam?.draft.map((p) => p.id) ?? []);
    if (origIds.size !== currIds.size) return true;
    return (this.selectedTeam?.draft ?? []).some((p) => !origIds.has(p.id));
  }

  get pendingPokemonIds(): Set<string> {
    const origIds = new Set(this.originalDraft.map((p) => p.id));
    return new Set(
      (this.selectedTeam?.draft ?? [])
        .filter((p) => !origIds.has(p.id))
        .map((p) => p.id),
    );
  }

  get draftedIds(): string[] {
    if (this.draftDetails.allowDuplicates)
      return (this.selectedTeam?.draft ?? []).map((p) => p.id);
    return this.teams.flatMap((team) =>
      (team.id === this.selectedTeam?.id
        ? this.selectedTeam.draft
        : team.draft
      ).map((p) => p.id),
    );
  }

  get draftRounds(): League.LeagueTeam[][] {
    const orderedTeams = this.draftDetails.teamOrder
      .map((teamId) => this.teamsMap.get(teamId))
      .filter((team): team is League.LeagueTeam => team !== undefined);
    return Array.from({ length: this.draftDetails.roundCount }, (_, i) => {
      const round = [...orderedTeams];
      if (this.draftDetails.orderProgression === 'snake' && i % 2 === 1) {
        round.reverse();
      }
      return round;
    });
  }

  private applyDraftDetails(data: DraftDetailsResponse): void {
    this.teams = data.teams;
    this.leagueName = data.leagueName;
    this.poolName = data.poolName;
    this.currentPick = data.currentPick;
    this.canDraftCounts = data.canDraftCounts ?? {};
    this.noTimer = data.noTimer;
    this.draftDetails.orderProgression = data.orderProgression;
    this.draftDetails.sequentialTurns = data.sequentialTurns;
    this.points = data.points;
    this.minDraftCount = data.minDraftCount;
    this.tierRequirements = data.tierRequirements ?? [];
    this.draftDetails.roundCount = data.rounds;
    this.draftDetails.teamOrder = data.teamOrder;
    this.draftDetails.status = data.status;
    this.draftDetails.picksBlind = data.picksBlind;
    this.draftDetails.canSeeAllPicks = data.canSeeAllPicks;
    this.draftDetails.allowDuplicates = data.allowDuplicates;
  }

  private loadDraftDetails(): void {
    this.leagueService
      .getPoolDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const previouslySelectedTeamId = this.selectedTeam?.id;
        this.applyDraftDetails(data);
        this.selectedTeam =
          this.teams.find((team) => team.id === previouslySelectedTeamId) ??
          this.teams[0];
        this.originalDraft = [...(this.selectedTeam?.draft ?? [])];
        this.isLoading = false;
        this.scheduleScrollToCurrentRoundOnLoad();
        this.startCountdown();
      });
  }

  private on<T>(event: string): Observable<T> {
    return this.eventStream
      .on<T>(event)
      .pipe(takeUntilDestroyed(this.destroyRef));
  }

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.draftStart = info.draftStart
          ? new Date(info.draftStart)
          : undefined;
        this.updateDraftStartDisplay();
      });

    this.loadDraftDetails();

    this.on<DraftAddedEvent>('league.draft.added').subscribe((data) => {
      if (this.leagueService.poolSlug() !== data.poolSlug) return;

      const pokemon = data.pick.pokemon;
      this.teams = this.teams.map((team) => {
        const newTeam = { ...team };
        if (team.id === data.team.id) {
          if (pokemon) newTeam.draft = data.team.draft;
          newTeam.pickCount = (team.pickCount ?? team.draft.length) + 1;
          newTeam.picks = newTeam.picks.filter((_, index) => index);
        }
        if (pokemon && !this.draftDetails.allowDuplicates)
          newTeam.picks = newTeam.picks.map((round) =>
            round.filter((pick) => pick.id !== pokemon.id),
          );
        return newTeam;
      });

      if (this.selectedTeam) {
        const updatedSelectedTeam = this.teams.find(
          (t) => t.id === this.selectedTeam.id,
        );

        if (updatedSelectedTeam) {
          updatedSelectedTeam.pointTotal = updatedSelectedTeam.draft.reduce(
            (points, p) => points + (p.cost ?? 0),
            0,
          );
          Object.assign(this.selectedTeam, updatedSelectedTeam);
        }
      }

      this.canDraftCounts = data.canDraftCounts ?? {};
      this.notificationService.show(
        pokemon
          ? `${data.team.name} drafted ${pokemon.name}!`
          : `${data.team.name} made a pick.`,
        'success',
      );
    });

    this.on<DraftPickUpdatedEvent>('league.draft.updated').subscribe((data) => {
      if (this.leagueService.poolSlug() !== data.poolSlug) return;

      const isViewedTeam = this.selectedTeam?.id === data.team.id;
      const droppedStagedPicks =
        isViewedTeam && this.pendingPokemonIds.size > 0;

      this.teams = this.teams.map((team) => {
        const newTeam = { ...team };
        if (team.id === data.team.id) newTeam.draft = data.team.draft;
        if (data.pokemon && !this.draftDetails.allowDuplicates)
          newTeam.picks = newTeam.picks.map((round) =>
            round.filter((pick) => pick.id !== data.pokemon!.id),
          );
        return newTeam;
      });

      const updatedSelectedTeam = this.teams.find(
        (team) => team.id === this.selectedTeam?.id,
      );
      if (updatedSelectedTeam) {
        updatedSelectedTeam.pointTotal = updatedSelectedTeam.draft.reduce(
          (points, pokemon) => points + (pokemon.cost ?? 0),
          0,
        );
        Object.assign(this.selectedTeam, updatedSelectedTeam);
        if (isViewedTeam) this.originalDraft = [...data.team.draft];
      }

      this.canDraftCounts = data.canDraftCounts ?? {};
      this.notificationService.show(
        this.pickUpdateMessage(data),
        data.pokemon ? 'info' : 'warning',
      );
      if (droppedStagedPicks)
        this.notificationService.show(
          'An organizer changed this roster, so your unsaved picks were reset.',
          'warning',
        );
    });

    this.on<DraftCounterEvent>('league.draft.counter').subscribe((data) => {
      if (this.leagueService.poolSlug() !== data.poolSlug) return;
      this.currentPick = data.currentPick;
      this.canDraftCounts = data.canDraftCounts ?? {};
      this.startCountdown();
      const teamName =
        this.teamsMap.get(data.nextTeam)?.name ?? 'Unknown team';
      this.notificationService.show(
        `Now drafting: ${teamName}${this.pickTimeSuffix()}`,
        'info',
      );
    });

    this.on<DraftStatusEvent>('league.draft.status').subscribe((data) => {
      if (this.leagueService.poolSlug() !== data.poolSlug) return;
      this.draftDetails.status = data.status;
      this.currentPick = data.currentPick;
      if (data.noTimer !== undefined) this.noTimer = data.noTimer;
      this.updateDraftStartDisplay();
      switch (data.status) {
        case 'PAUSED':
          this.countdownTick$.next();
          this.clearHalfwayReminder();
          break;
        case 'COMPLETED':
          this.countdownTick$.next();
          this.clearHalfwayReminder();
          if (this.draftDetails.picksBlind) this.loadDraftDetails();
          break;
        case 'IN_PROGRESS':
          this.startCountdown();
          break;
      }
      this.notificationService.show(
        `Draft status: ${STATUS_LABELS[data.status] ?? data.status}`,
        'info',
      );
    });

    this.on<{ poolSlug: string }>('league.draft.completed').subscribe(
      (data) => {
        if (this.leagueService.poolSlug() !== data.poolSlug) return;
        this.draftDetails.status = 'COMPLETED';
        this.countdownTick$.next();
        this.clearHalfwayReminder();
        if (this.draftDetails.picksBlind) this.loadDraftDetails();
      },
    );

    this.on<DraftSkipEvent>('league.draft.skip').subscribe((data) => {
      if (this.leagueService.poolSlug() !== data.poolSlug) return;
      this.notificationService.show(`${data.teamName} was skipped!`, 'info');
    });
  }

  private pickUpdateMessage(data: DraftPickUpdatedEvent): string {
    const slot =
      data.round === undefined
        ? `${data.team.name}'s roster`
        : `${data.team.name}'s round ${data.round + 1} pick`;

    if (this.teamsMap.get(data.team.id)?.picksHidden)
      return `An organizer changed ${slot}.`;
    if (data.pokemon && data.previous)
      return `An organizer changed ${slot} from ${data.previous.name} to ${data.pokemon.name}.`;
    if (data.pokemon)
      return `An organizer set ${slot} to ${data.pokemon.name}.`;
    return `An organizer cleared ${data.previous?.name ?? 'a pick'} from ${slot}.`;
  }

  private scrollToCurrentRoundOnLoad(): void {
    if (this.hasAutoScrolledToCurrentRound || !this.currentPick) return;
    const container = this.draftRoundsContainer()?.nativeElement;
    if (!container) return;

    const roundIndex = Math.max(this.currentPick.round, 0);
    const targetRound = container.querySelector<HTMLElement>(
      `[data-round-index="${roundIndex}"]`,
    );

    if (!targetRound) return;

    const containerTop = container.getBoundingClientRect().top;
    const targetTop = targetRound.getBoundingClientRect().top;

    container.scrollTo({
      top: container.scrollTop + (targetTop - containerTop),
      behavior: 'auto',
    });

    this.hasAutoScrolledToCurrentRound = true;
  }

  private scheduleScrollToCurrentRoundOnLoad(attempt = 0): void {
    if (this.hasAutoScrolledToCurrentRound || !this.currentPick) return;

    setTimeout(() => {
      this.scrollToCurrentRoundOnLoad();
      if (
        !this.hasAutoScrolledToCurrentRound &&
        attempt < this.SCROLL_MAX_ATTEMPTS
      ) {
        this.scheduleScrollToCurrentRoundOnLoad(attempt + 1);
      }
    }, this.SCROLL_RETRY_DELAY_MS);
  }

  startCountdown(): void {
    this.countdownTick$.next();
    interval(this.COUNTDOWN_TICK_MS)
      .pipe(takeUntil(this.countdownTick$))
      .subscribe(() => {
        this.skipTimeDisplay = this.timeUntil(this.currentPick?.skipTime);
        this.updateDraftStartDisplay();
      });
    this.scheduleHalfwayReminder();
  }

  private currentPickingTeam(): League.LeagueTeam | undefined {
    if (!this.currentPick) return undefined;
    return this.draftRounds[this.currentPick.round]?.[
      this.currentPick.position
    ];
  }

  private pickTimeSuffix(): string {
    if (this.noTimer || !this.currentPick?.skipTime) return '';
    const msRemaining =
      new Date(this.currentPick.skipTime).getTime() - Date.now();
    if (msRemaining <= 0) return '';
    return ` (${formatCountdown(msRemaining)} to pick)`;
  }

  private clearHalfwayReminder(): void {
    if (this.halfwayReminderTimer !== undefined) {
      clearTimeout(this.halfwayReminderTimer);
      this.halfwayReminderTimer = undefined;
    }
  }

  private scheduleHalfwayReminder(): void {
    this.clearHalfwayReminder();
    if (this.noTimer || !this.currentPick?.skipTime) return;

    const msRemaining =
      new Date(this.currentPick.skipTime).getTime() - Date.now();
    const msUntilHalfway = msRemaining / 2;
    if (msUntilHalfway <= 0) return;

    const round = this.currentPick.round;
    const position = this.currentPick.position;
    this.halfwayReminderTimer = setTimeout(() => {
      if (
        !this.currentPick ||
        this.currentPick.round !== round ||
        this.currentPick.position !== position
      )
        return;

      const teamName = this.currentPickingTeam()?.name ?? 'The current team';
      this.notificationService.show(
        `${teamName} is halfway through their pick timer${this.pickTimeSuffix()}!`,
        'warning',
      );
    }, msUntilHalfway);
  }

  get isPreDraft(): boolean {
    return !['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(
      this.draftDetails.status,
    );
  }

  private updateDraftStartDisplay(): void {
    if (!this.isPreDraft || !this.draftStart) {
      this.draftStartDisplay = null;
      this.draftStartOverdue = false;
      return;
    }
    const diffMs = this.draftStart.getTime() - Date.now();
    this.draftStartDisplay = diffMs > 0 ? formatCountdown(diffMs) : null;
    this.draftStartOverdue = diffMs <= 0;
  }

  moveUp(picks: League.LeaguePokemon[], index: number): void {
    if (!index || index >= picks.length) return;
    const newPicks = [...picks];
    const temp = newPicks[index];
    newPicks[index] = newPicks[index - 1];
    newPicks[index - 1] = temp;
    picks.splice(0, picks.length, ...newPicks);
    this.picksChanged = true;
  }

  pokemonSelected(pokemon: DraftChoice): void {
    if (!this.draftDetails.sequentialTurns) {
      if (this.canDraft()) {
        this.draftPokemon(pokemon);
      }
      return;
    }

    if (this.canDraft() && !this.selectedPick) {
      this.draftPokemon(pokemon);
    } else {
      this.addChoice(pokemon);
    }
  }

  draftPokemon(pokemon: DraftChoice): void {
    if (pokemon.cost == null) return;

    this.selectedTeam.draft.push({
      id: pokemon.id,
      name: pokemon.name,
      tier: pokemon.tier,
      cost: pokemon.cost,
      addons: pokemon.addons,
    });
    this.selectedTeam.pointTotal += pokemon.cost;

    this.selectedTeam.picks = this.selectedTeam.picks
      .slice(1)
      .map((round) => round.filter((p) => p.id !== pokemon.id));
  }

  removeDraftedPokemon(pokemon: League.LeaguePokemon): void {
    this.selectedTeam.draft = this.selectedTeam.draft.filter(
      (p) => p.id !== pokemon.id,
    );
    this.selectedTeam.pointTotal -= pokemon.cost;
    this.selectedTeam.picks = [[], ...this.selectedTeam.picks];
    this.selectedPick = 0;
  }

  deleteChoice(picks: League.LeaguePokemon[], index: number): void {
    const newPicks = picks.filter((_, i) => i !== index);
    picks.splice(0, picks.length, ...newPicks);
    this.picksChanged = true;
  }

  addChoice(pokemon: DraftChoice): void {
    if (pokemon.cost == null) return;
    const choice = {
      name: pokemon.name,
      id: pokemon.id,
      tier: pokemon.tier,
      cost: pokemon.cost,
      addons: pokemon.addons,
    };
    if (!this.draftDetails.sequentialTurns) {
      this.selectedTeam.picks[this.selectedPick] = [choice];
      const nextEmpty = this.selectedTeam.picks.findIndex(
        (pick) => pick.length === 0,
      );
      if (nextEmpty !== -1) this.selectedPick = nextEmpty;
    } else {
      this.selectedTeam.picks[this.selectedPick].push(choice);
    }

    this.picksChanged = true;
  }

  unmetTierRequirements(): {
    tierName: string;
    have: number;
    required: number;
  }[] {
    if (!this.tierRequirements.length) return [];
    const counts = new Map<string, number>();
    for (const pokemon of this.selectedTeam.draft) {
      counts.set(pokemon.tier, (counts.get(pokemon.tier) ?? 0) + 1);
    }
    return this.tierRequirements
      .map((req) => ({
        tierName: req.tierName,
        have: counts.get(req.tierName) ?? 0,
        required: req.required,
      }))
      .filter((req) => req.have < req.required);
  }

  isRosterValid(): boolean {
    return !this.points || this.selectedTeam.pointTotal <= this.points;
  }

  canSave(): boolean {
    return this.hasPendingChanges && !this.isSubmitting && this.isRosterValid();
  }

  saveDraft(): void {
    if (!this.canSave()) return;
    this.isSubmitting = true;

    const teamId = this.selectedTeam.id;
    const origIds = new Set(this.originalDraft.map((p) => p.id));
    const currIds = new Set(this.selectedTeam.draft.map((p) => p.id));

    const add = this.selectedTeam.draft
      .filter((p) => !origIds.has(p.id))
      .map((p) => ({ pokemonId: p.id, addons: p.addons }));
    const remove = this.originalDraft
      .filter((p) => !currIds.has(p.id))
      .map((p) => p.id);
    const picks = this.selectedTeam.picks.map((round) =>
      round.map((pick) => ({ pokemonId: pick.id, addons: pick.addons })),
    );

    this.leagueService
      .draftPokemon(teamId, { add, remove, picks })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (data) => this.onSaveSettled(data, teamId),
        error: () => {
          this.notificationService.show(
            'Failed to save draft changes. Please try again.',
            'error',
          );
        },
      });
  }

  private onSaveSettled(data: DraftDetailsResponse, teamId: string): void {
    this.picksChanged = false;
    this.applyDraftDetails(data);
    this.selectedTeam =
      this.teams.find((team) => team.id === teamId) ?? this.teams[0];
    this.originalDraft = [...(this.selectedTeam?.draft ?? [])];
  }

  timeUntil(time: Date | string | undefined): string | null {
    if (!time) return null;
    const diffMs = new Date(time).getTime() - Date.now();
    if (diffMs <= 0) return '0s';

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
    if (!this.isInProgress) return undefined;
    if (!this.draftDetails.sequentialTurns) {
      return this.canDraft() ? 'Add to Roster' : undefined;
    }
    if (this.canDraft() && !this.selectedPick) return 'Add to Roster';
    if (!this.selectedTeam.picks.length) return undefined;
    return `Add to picks (${this.selectedPick + this.selectedTeam.draft.length + 1})`;
  }

  altButtonText(): string | undefined {
    if (!this.isInProgress) return undefined;
    if (!this.draftDetails.sequentialTurns) {
      return this.canDraft() ? 'Draft Tera captain' : undefined;
    }
    if (this.canDraft() && !this.selectedPick) return 'Draft Tera captain';
    if (!this.selectedTeam.picks.length) return undefined;
    return `Add as Tera captain (${this.selectedPick + this.selectedTeam.draft.length + 1})`;
  }

  draftableCount(): number {
    if (!this.selectedTeam.isCoach) return 0;
    const serverCount = this.canDraftCounts[this.selectedTeam.id] ?? 0;
    const origIds = new Set(this.originalDraft.map((p) => p.id));
    const currIds = new Set(this.selectedTeam.draft.map((p) => p.id));
    const pendingAdds = this.selectedTeam.draft.filter(
      (p) => !origIds.has(p.id),
    ).length;
    const pendingRemoves = this.originalDraft.filter(
      (p) => !currIds.has(p.id),
    ).length;
    return Math.max(0, serverCount - pendingAdds + pendingRemoves);
  }

  get isInProgress(): boolean {
    return this.draftDetails.status === 'IN_PROGRESS';
  }

  canDraft(): boolean {
    return this.isInProgress && this.draftableCount() > 0;
  }
}
