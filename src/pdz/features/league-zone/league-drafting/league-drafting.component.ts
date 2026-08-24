import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { NumberSuffixPipe } from '@pdz/shared/pipes/number-suffix.pipe';
import { interval, Observable, Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TierListComponent } from '../../tier-lists/tier-list/tier-list.component';
import { LeagueNotificationService } from '../league-notification.service';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { formatCountdown } from '../league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';

interface DraftAddedEvent {
  draftSlug: string;
  pick: {
    pokemon: League.LeaguePokemon;
  };
  team: {
    id: string;
    name: string;
    draft: League.LeaguePokemon[];
  };
  canDraftCounts: Record<string, number>;
}

interface DraftCounterEvent {
  draftSlug: string;
  currentPick: {
    round: number;
    position: number;
    skipTime?: Date;
  };
  canDraftCounts: Record<string, number>;
  nextTeam: string;
}

/** An organizer edited a roster slot out of band — set, swapped, or cleared. */
interface DraftPickUpdatedEvent {
  draftSlug: string;
  round?: number;
  /** Absent when the slot was cleared rather than set. */
  pokemon?: League.LeaguePokemon;
  previous?: League.LeaguePokemon;
  team: {
    id: string;
    name: string;
    draft: League.LeaguePokemon[];
  };
  canDraftCounts: Record<string, number>;
}

interface DraftStatusEvent {
  draftSlug: string;
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  noTimer?: boolean;
  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };
}

interface DraftSkipEvent {
  draftSlug: string;
  teamName: string;
}

type DraftDetailsResponse =
  ReturnType<LeagueZoneService['getDraftDetails']> extends Observable<infer T>
    ? T
    : never;

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    TierListComponent,
    SpriteComponent,
    IconComponent,
    NumberSuffixPipe,
    LoadingComponent,
    RouterModule,
    PokemonTypeComponent,
    ButtonComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
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
  private halfwayReminderTimer?: ReturnType<typeof setTimeout>;
  private hasAutoScrolledToCurrentRound = false;
  private readonly SCROLL_RETRY_DELAY_MS = 50;
  private readonly SCROLL_MAX_ATTEMPTS = 10;

  @ViewChild('draftRoundsContainer')
  draftRoundsContainer?: ElementRef<HTMLDivElement>;

  teams: League.LeagueTeam[] = [];
  canDraftCounts: Record<string, number> = {};
  selectedTeam!: League.LeagueTeam;

  /** Snapshot of selectedTeam.draft as confirmed by the server (set on load and after each save). */
  private originalDraft: League.LeaguePokemon[] = [];
  /** True when the picks queue (choices/rounds) has been changed but not yet saved. */
  private picksChanged: boolean = false;
  isSubmitting: boolean = false;

  leagueName: string = '';
  draftName: string = '';
  points: number = 0;
  minDraftCount: number = 0;
  tierRequirements: { tierName: string; required: number }[] = [];

  isLoading: boolean = true;

  currentPick?: {
    round: number;
    position: number;
    skipTime?: Date;
  };

  selectedPick: number = 0;
  skipTimeDisplay: string | null = null;
  noTimer: boolean = false;
  draftStart?: Date;
  draftStartDisplay: string | null = null;
  draftStartOverdue: boolean = false;

  draftDetails: {
    orderProgression: 'snake' | 'linear';
    sequentialTurns: boolean;
    visibility: 'ALL' | 'SELF';
    roundCount: number;
    teamOrder: string[];
    status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  } = {
    orderProgression: 'snake',
    sequentialTurns: true,
    visibility: 'SELF',
    roundCount: 0,
    teamOrder: [],
    status: 'IN_PROGRESS',
  };

  // Configuration constants
  private readonly COUNTDOWN_TICK_MS = 1000;
  private readonly FAST_TIME_THRESHOLD_MS = 300; // seconds

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

  /** Every Pokemon already taken in this draft, across all teams (plus the selected
   * team's locally staged picks), so the tier list grays out anything unavailable. */
  get draftedIds(): string[] {
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
    this.draftName = data.draftName;
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
    this.draftDetails.visibility = data.visibility;
  }

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((info) => {
        this.draftStart = info.draftStart
          ? new Date(info.draftStart)
          : undefined;
        this.updateDraftStartDisplay();
      });

    this.leagueService
      .getDraftDetails()
      .pipe(takeUntil(this.destroy$))
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

    this.webSocketService
      .on<DraftAddedEvent>('league.draft.added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.draftSlug() !== data.draftSlug) return;

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
              (points, p) => points + (p.cost ?? 0),
              0,
            );
            Object.assign(this.selectedTeam, updatedSelectedTeam);
          }
        }

        this.canDraftCounts = data.canDraftCounts ?? {};
        this.notificationService.show(
          `${data.team.name} drafted ${data.pick.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<DraftPickUpdatedEvent>('league.draft.updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.draftSlug() !== data.draftSlug) return;

        const isViewedTeam = this.selectedTeam?.id === data.team.id;
        const droppedStagedPicks =
          isViewedTeam && this.pendingPokemonIds.size > 0;

        this.teams = this.teams.map((team) => {
          const newTeam = { ...team };
          if (team.id === data.team.id) newTeam.draft = data.team.draft;
          // A slot the organizer just filled is off the board for everyone.
          if (data.pokemon)
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
          // The organizer's roster is the new baseline — diffing against the
          // old one would send a save that undoes their edit.
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

    this.webSocketService
      .on<DraftCounterEvent>('league.draft.counter')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.draftSlug() !== data.draftSlug) {
          return;
        }
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

    this.webSocketService
      .on<DraftStatusEvent>('league.draft.status')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (this.leagueService.draftSlug() !== data.draftSlug) {
          return;
        }
        this.draftDetails.status = data.status;
        this.currentPick = data.currentPick;
        if (data.noTimer !== undefined) this.noTimer = data.noTimer;
        this.updateDraftStartDisplay();
        switch (data.status) {
          case 'PAUSED':
          case 'COMPLETED':
            this.countdownTick$.next();
            this.clearHalfwayReminder();
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
        if (this.leagueService.draftSlug() !== data.draftSlug) {
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
    this.clearHalfwayReminder();
  }

  /** Phrases an organizer's out-of-band roster edit for the notification feed. */
  private pickUpdateMessage(data: DraftPickUpdatedEvent): string {
    const slot =
      data.round === undefined
        ? `${data.team.name}'s roster`
        : `${data.team.name}'s round ${data.round + 1} pick`;

    if (data.pokemon && data.previous)
      return `An organizer changed ${slot} from ${data.previous.name} to ${data.pokemon.name}.`;
    if (data.pokemon)
      return `An organizer set ${slot} to ${data.pokemon.name}.`;
    return `An organizer cleared ${data.previous?.name ?? 'a pick'} from ${slot}.`;
  }

  private scrollToCurrentRoundOnLoad(): void {
    if (this.hasAutoScrolledToCurrentRound || !this.currentPick) return;
    const container = this.draftRoundsContainer?.nativeElement;
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

  private scheduleScrollToCurrentRoundOnLoad(attempt: number = 0): void {
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

  /** The current picking team, derived the same way the round table highlights it. */
  private currentPickingTeam(): League.LeagueTeam | undefined {
    if (!this.currentPick) return undefined;
    return this.draftRounds[this.currentPick.round]?.[
      this.currentPick.position
    ];
  }

  /** " — Xm to pick" suffix for turn-change notifications; empty when there's no active clock. */
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

  /** Fires a single notification at the midpoint of the current team's clock. */
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
      // Bail if the turn has already moved on since this was scheduled.
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

  /** Legacy drafts may carry statuses like NOT_STARTED, so treat anything not active/finished as pre-draft. */
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

  pokemonSelected(pokemon: {
    id: string;
    name: string;
    addons?: string[];
    tier: string;
    cost?: number;
  }): void {
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

  draftPokemon(pokemon: {
    id: string;
    name: string;
    addons?: string[];
    tier: string;
    cost?: number;
  }): void {
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

  addChoice(pokemon: {
    id: string;
    name: string;
    addons?: string[];
    tier: string;
    cost?: number;
  }): void {
    if (pokemon.cost == null) return;
    if (!this.draftDetails.sequentialTurns) {
      this.selectedTeam.picks[this.selectedPick] = [
        {
          name: pokemon.name,
          id: pokemon.id,
          tier: pokemon.tier,
          cost: pokemon.cost,
          addons: pokemon.addons,
        },
      ];
      const nextEmpty = this.selectedTeam.picks.findIndex(
        (pick) => pick.length === 0,
      );
      if (nextEmpty !== undefined) this.selectedPick = nextEmpty;
    } else {
      this.selectedTeam.picks[this.selectedPick].push({
        name: pokemon.name,
        id: pokemon.id,
        tier: pokemon.tier,
        cost: pokemon.cost,
        addons: pokemon.addons,
      });
    }

    this.picksChanged = true;
  }

  /** Tier requirements not yet met by selectedTeam's currently staged draft. */
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

  /**
   * Only the actual drafted roster (not the queued picks) must stay within budget; roster
   * completeness (min count, tier requirements) is only required once the draft is finished,
   * not on every intermediate save. A falsy `points` means the tournament has no point budget
   * (e.g. a BST-cap format), so there's nothing to enforce.
   */
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
        takeUntil(this.destroy$),
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
    if (!this.isInProgress) return undefined;
    if (!this.draftDetails.sequentialTurns) {
      return this.canDraft() ? 'Add to Roster' : undefined;
    }
    if (this.canDraft() && !this.selectedPick) return 'Add to Roster';
    if (!this.selectedTeam.picks.length) return undefined;
    return (
      'Add to Picks (' +
      (this.selectedPick + this.selectedTeam.draft.length + 1) +
      ')'
    );
  }

  altButtonText(): string | undefined {
    if (!this.isInProgress) return undefined;
    if (!this.draftDetails.sequentialTurns) {
      return this.canDraft() ? 'Draft Tera Capt.' : undefined;
    }
    if (this.canDraft() && !this.selectedPick) return 'Draft Tera Capt.';
    if (!this.selectedTeam.picks.length) return undefined;
    return (
      'Add as Tera Capt. (' +
      (this.selectedPick + this.selectedTeam.draft.length + 1) +
      ')'
    );
  }

  /** How many Pokemon selectedTeam can draft right now, accounting for locally staged changes. */
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
