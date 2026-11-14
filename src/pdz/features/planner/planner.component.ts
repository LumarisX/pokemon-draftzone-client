import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ensureNumber, ensureString } from '@pdz/core/utils';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  switchMap,
} from 'rxjs';
import { PlannerContext } from './planner-context';
import { TournamentPlannerService } from './tournament-planner.service';
import { DraftPokemon } from '../drafts/draft.model';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../drafts/matchup-overview/matchup-interface';
import { PokemonSearchCoreComponent } from '../tools/pokemon-search/pokemon-search-core/pokemon-search-core.component';
import { PlannerMoveCoverageComponent } from './coverage/move-coverage.component';
import { PlannerTeamCoverageComponent } from './coverage/team-coverage.component';
import { MoveComponent } from './moves/moves.component';
import { PlannerService } from './planner.service';
import { PlannerSettingsComponent } from './settings/settings.component';
import { PlannerSummaryComponent } from './summary/summary.component';
import { PlannerTeamComponent } from './team/team.component';
import { PlannerTypechartComponent } from './typechart/typechart.component';
import { DEFAULT_RULESET } from '@pdz/core/rulesets';
import { safeStorage } from '@pdz/core/utils/storage';
import { PlannerSyncService } from './planner-sync.service';

interface LSTeamData {
  id: string;
  value: number | null;
  tier: string;
  locked: boolean;
}

export interface LSDraftData {
  format: string;
  ruleset: string;
  draftName: string;
  min: number;
  max: number;
  system: string;
  totalPoints: number;
  team: LSTeamData[];
  baseline?: string[];
}

type PlannerView = 'analysis' | 'find' | 'compare';
type LoadState = 'loading' | 'ready' | 'error' | 'no-tier-list';
type DetailsRequest = { team: string[]; format: string; ruleset: string };

const FREE_STORAGE_KEY = 'plannerData';

const MAX_DRAFTS = 9;
const AUTOSAVE_DEBOUNCE_MS = 800;
const ADD_FEEDBACK_MS = 2500;
const LARGE_SCREEN_QUERY = '(min-width: 1024px)';
const DEFAULT_PANEL_RATIO = 0.34;
const MAX_PANEL_RATIO = 0.6;
const MIN_PANEL_WIDTH_REM = 18;
const DEFAULT_PANEL_MAX_WIDTH_REM = 32;

@Component({
  selector: 'pdz-planner',
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonLayoutComponent,
    MoveComponent,
    PageComponent,
    PlannerMoveCoverageComponent,
    PlannerTeamCoverageComponent,
    PlannerSettingsComponent,
    PlannerSummaryComponent,
    PlannerTeamComponent,
    PlannerTypechartComponent,
    PokemonSearchCoreComponent,
  ],
})
export class PlannerComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly plannerService = inject(PlannerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentPlanner = inject(TournamentPlannerService);
  private readonly plannerSync = inject(PlannerSyncService);
  private readonly toast = inject(ToastService);

  readonly maxDrafts = MAX_DRAFTS;
  readonly isTournament = this.route.snapshot.data['planner'] === 'tournament';

  context = signal<PlannerContext | null>(null);
  loadState = signal<LoadState>(this.isTournament ? 'loading' : 'ready');
  analysisFailed = signal(false);

  private readonly detailsRequest$ = new Subject<DetailsRequest | null>();
  private readonly subscriptions = new Subscription();

  plannerForm!: FormGroup<{ drafts: FormArray<DraftFormGroup> }>;

  selectedDraft = signal(0);
  typechart = signal<TypeChart>({ team: [] });
  summary = signal<Summary | undefined>(undefined);
  movechart = signal<MoveChart | undefined>(undefined);
  coverage = signal<Coverage | undefined>(undefined);

  mainView = signal<PlannerView>('analysis');
  takenIds = signal<string[]>([]);
  addBlocked = signal<string | null>(null);

  isLargeScreen = signal(false);
  panelOpen = signal(false);
  panelRatio = signal(DEFAULT_PANEL_RATIO);
  panelCustomized = signal(false);
  isResizing = signal(false);
  hasUnsavedEdits = signal(false);
  pendingDeleteIndex = signal<number | null>(null);

  private readonly tabRefs = viewChildren<ElementRef<HTMLElement>>('tabEl');

  private lastSavedJson?: string;
  private pendingDeleteTimeoutId?: ReturnType<typeof setTimeout>;
  private addFeedbackTimeoutId?: ReturnType<typeof setTimeout>;
  private resizingPointerId: number | null = null;
  private resizeStartX = 0;
  private resizeStartRatio = DEFAULT_PANEL_RATIO;
  private resizeContainerWidth = 1;
  private largeScreenQuery?: MediaQueryList;
  private readonly onLargeScreenChange = (event: MediaQueryListEvent) => {
    this.isLargeScreen.set(event.matches);
    if (event.matches) this.panelOpen.set(false);
  };

  hasAnalysis = computed(
    () =>
      !!this.summary() ||
      !!this.typechart().team.length ||
      !!this.movechart() ||
      !!this.coverage(),
  );

  panelFlex = computed(() => {
    const percent = `${(this.panelRatio() * 100).toFixed(2)}%`;
    if (this.panelCustomized()) return `0 0 ${percent}`;
    return `0 0 min(${DEFAULT_PANEL_MAX_WIDTH_REM}rem, ${percent})`;
  });

  ngOnInit(): void {
    this.largeScreenQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    this.isLargeScreen.set(this.largeScreenQuery.matches);
    this.largeScreenQuery.addEventListener('change', this.onLargeScreenChange);

    this.subscriptions.add(
      this.detailsRequest$
        .pipe(
          switchMap((request) => {
            if (!request) return of(null);
            return this.plannerService
              .getPlannerDetails(request.team, request.format, request.ruleset)
              .pipe(
                map((planner) => ({ planner })),
                catchError(() => of({ planner: null })),
              );
          }),
        )
        .subscribe((result) => {
          const planner = result?.planner;
          this.analysisFailed.set(!!result && !planner);
          this.typechart.set(planner?.typechart ?? { team: [] });
          this.summary.set(planner?.summary);
          this.movechart.set(planner?.movechart);
          this.coverage.set(planner?.coverage);
        }),
    );

    this.subscriptions.add(
      this.plannerSync.merged
        .pipe(filter((key) => key === this.storageKey && !!this.plannerForm))
        .subscribe(() => this.reloadMergedPlans()),
    );

    if (this.isTournament) {
      this.loadContext();
      this.subscriptions.add(
        this.tournamentPlanner
          .rosterChanged()
          .subscribe(() => this.refreshContext()),
      );
      return;
    }

    this.buildForm(this.initialDrafts());
  }

  loadContext(): void {
    this.loadState.set('loading');
    this.subscriptions.add(
      this.tournamentPlanner.load().subscribe({
        next: (context) => {
          if (!context) {
            this.loadState.set('no-tier-list');
            return;
          }
          this.context.set(context);
          this.buildForm(this.getStoredPlannerData());
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      }),
    );
  }

  private refreshContext(): void {
    const current = this.context();
    if (!current || !this.plannerForm) return;
    this.subscriptions.add(
      this.tournamentPlanner
        .load()
        .pipe(catchError(() => EMPTY))
        .subscribe((context) => {
          if (!context) return;
          current.options$.next(context.options$.value);
          const next = { ...context, options$: current.options$ };
          this.context.set(next);
          for (const group of this.draftArray.controls)
            this.applyContext(group, next);
          this.draftArray.updateValueAndValidity();
          this.updateDetails();
        }),
    );
  }

  private reloadMergedPlans(): void {
    this.lastSavedJson = safeStorage.get(this.storageKey) ?? undefined;
    this.buildForm(this.getStoredPlannerData());
    this.selectedDraft.update((index) =>
      Math.min(index, this.draftArray.length - 1),
    );
    this.hasUnsavedEdits.set(false);
    this.toast.info(
      'These plans were also changed on another device. Both sets are here now.',
    );
  }

  private initialDrafts(): Partial<LSDraftData>[] {
    const importedDraft = this.takeImportedDraft();
    const storedData = this.getStoredPlannerData().filter(
      (draft) => Object.keys(draft).length > 0,
    );
    if (!importedDraft) return storedData.length ? storedData : [{}];

    const importedName = normalizeName(importedDraft.draftName);
    return [
      importedDraft,
      ...storedData.filter(
        (stored) => normalizeName(stored.draftName) !== importedName,
      ),
    ];
  }

  private buildForm(drafts: Partial<LSDraftData>[]): void {
    this.plannerForm = this.fb.group({
      drafts: new FormArray<DraftFormGroup>([]),
    });
    for (const data of drafts)
      this.draftArray.push(this.createDraftFormGroup(data), {
        emitEvent: false,
      });

    this.draftArray.valueChanges.subscribe(() =>
      this.hasUnsavedEdits.set(true),
    );
    this.draftArray.valueChanges
      .pipe(debounceTime(AUTOSAVE_DEBOUNCE_MS))
      .subscribe(() => this.setStoredPlannerData());

    this.updateDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.flushPendingSave();
    clearTimeout(this.pendingDeleteTimeoutId);
    clearTimeout(this.addFeedbackTimeoutId);
    this.largeScreenQuery?.removeEventListener(
      'change',
      this.onLargeScreenChange,
    );
  }

  @HostListener('window:beforeunload')
  @HostListener('document:visibilitychange')
  flushPendingSave(): void {
    if (!this.hasUnsavedEdits() || !this.plannerForm) return;
    this.setStoredPlannerData();
  }

  get draftArray(): FormArray<DraftFormGroup> {
    return this.plannerForm.controls.drafts;
  }

  get draftSize(): number {
    return this.plannerForm?.controls.drafts.length ?? 0;
  }

  get draftFormGroup(): DraftFormGroup {
    return this.draftArray.at(this.selectedDraft());
  }

  get teamFormArray(): FormArray<TeamFormGroup> {
    return this.draftFormGroup.controls.team;
  }

  get isAtDraftLimit(): boolean {
    return this.draftSize >= MAX_DRAFTS;
  }

  selectDraft(index: number): void {
    this.cancelDelete();
    this.selectedDraft.set(index);
    this.updateDetails();
  }

  setMainView(view: PlannerView | null): void {
    if (!view) return;
    this.mainView.set(view);
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (document.querySelector('.cdk-overlay-pane')) return;
    this.closePanel();
  }

  addToTeam(pokemon: { id: string; name: string }): void {
    const slotIndex = this.teamFormArray.controls.findIndex(
      (control) =>
        !control.controls.locked.value && !control.controls.pokemon.value?.id,
    );

    if (slotIndex === -1) {
      this.addBlocked.set('No open slot. Clear or unlock one first.');
      clearTimeout(this.addFeedbackTimeoutId);
      this.addFeedbackTimeoutId = setTimeout(
        () => this.addBlocked.set(null),
        ADD_FEEDBACK_MS,
      );
      return;
    }

    this.addBlocked.set(null);
    this.teamFormArray
      .at(slotIndex)
      .controls.pokemon.setValue({ id: pokemon.id, name: pokemon.name });
  }

  onTabClick(index: number, nameInput: HTMLInputElement): void {
    if (index === this.selectedDraft()) {
      if (document.activeElement !== nameInput) nameInput.focus();
      return;
    }
    this.selectDraft(index);
  }

  leaveName(tab: HTMLElement): void {
    tab.focus();
  }

  onTabKeydown(
    event: KeyboardEvent,
    index: number,
    nameInput: HTMLInputElement,
  ): void {
    if (event.target !== event.currentTarget) return;
    const lastIndex = this.draftSize - 1;
    let nextIndex: number;

    switch (event.key) {
      case 'F2':
        event.preventDefault();
        nameInput.focus();
        nameInput.select();
        return;
      case 'ArrowRight':
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.selectDraft(nextIndex);
    this.tabRefs()[nextIndex]?.nativeElement.focus();
  }

  selectNameText(event: MouseEvent): void {
    (event.target as HTMLInputElement).select();
  }

  nameWidthCh(name: string | null | undefined): number {
    return Math.min(Math.max((name ?? '').length, 4), 22) + 1;
  }

  requestDelete(index: number): void {
    if (this.pendingDeleteIndex() === index) {
      this.confirmDelete(index);
      return;
    }
    this.pendingDeleteIndex.set(index);
    clearTimeout(this.pendingDeleteTimeoutId);
    this.pendingDeleteTimeoutId = setTimeout(
      () => this.pendingDeleteIndex.set(null),
      4000,
    );
  }

  confirmDelete(index: number): void {
    clearTimeout(this.pendingDeleteTimeoutId);
    this.pendingDeleteIndex.set(null);
    this.deletePlan(index);
  }

  cancelDelete(): void {
    clearTimeout(this.pendingDeleteTimeoutId);
    this.pendingDeleteIndex.set(null);
  }

  deletePlan(index: number): void {
    this.draftArray.removeAt(index);
    this.selectDraft(Math.min(index, this.draftSize - 1));
  }

  addDraft(): void {
    if (this.isAtDraftLimit) return;
    this.cancelDelete();
    this.draftArray.push(this.createDraftFormGroup({}));
    this.selectDraft(this.draftSize - 1);
  }

  copyToNew(index: number): void {
    if (this.isAtDraftLimit) return;
    this.cancelDelete();
    const draftCopy = this.draftArray.at(index).clone();
    const copyName = `${draftCopy.controls.draftName.value} Copy`.trim();
    const nameTaken = this.draftArray.controls.some(
      (group) =>
        normalizeName(group.controls.draftName.value) ===
        normalizeName(copyName),
    );
    draftCopy.controls.draftName.setValue(
      nameTaken ? this.unusedName(copyName) : copyName,
    );
    this.setDraftFormGroupSubscriptions(draftCopy);
    this.draftArray.push(draftCopy);
    this.selectDraft(this.draftSize - 1);
  }

  onPanelResizeStart(event: PointerEvent): void {
    const splitter = event.currentTarget as HTMLElement | null;
    const container = splitter?.closest('.planner__body') as HTMLElement | null;
    const panel = container?.querySelector(
      '.planner__panel',
    ) as HTMLElement | null;
    if (!splitter || !container || !panel) return;

    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);

    this.resizingPointerId = event.pointerId;
    this.resizeStartX = event.clientX;
    this.resizeContainerWidth = Math.max(container.clientWidth, 1);
    this.resizeStartRatio = this.clampPanelRatio(
      panel.getBoundingClientRect().width / this.resizeContainerWidth,
      this.resizeContainerWidth,
    );
    this.setPanelRatio(this.resizeStartRatio);
    this.isResizing.set(true);
  }

  onPanelSplitterKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.05 : 0.02;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const container = (event.currentTarget as HTMLElement).closest(
        '.planner__body',
      ) as HTMLElement | null;
      const panel = container?.querySelector(
        '.planner__panel',
      ) as HTMLElement | null;
      if (!container || !panel) return;

      const containerWidth = Math.max(container.clientWidth, 1);
      const current = panel.getBoundingClientRect().width / containerWidth;
      const delta = event.key === 'ArrowLeft' ? -step : step;
      this.setPanelRatio(this.clampPanelRatio(current + delta, containerWidth));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.panelCustomized.set(false);
      this.panelRatio.set(DEFAULT_PANEL_RATIO);
    }
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (!this.isPointerResizing(event)) return;
    const deltaX = event.clientX - this.resizeStartX;
    this.setPanelRatio(
      this.clampPanelRatio(
        this.resizeStartRatio + deltaX / this.resizeContainerWidth,
        this.resizeContainerWidth,
      ),
    );
  }

  @HostListener('document:pointerup', ['$event'])
  @HostListener('document:pointercancel', ['$event'])
  onDocumentPointerEnd(event: PointerEvent): void {
    if (!this.isPointerResizing(event)) return;
    this.resizingPointerId = null;
    this.isResizing.set(false);
  }

  updateDetails(): void {
    const team = this.teamFormArray.controls
      .filter(
        (group) =>
          group.controls.pokemon.valid &&
          group.controls.pokemon.value !== null &&
          group.controls.pokemon.value.id !== '',
      )
      .map((group) => group.controls.pokemon.value!.id);

    this.takenIds.set(team);

    this.detailsRequest$.next(
      team.length
        ? {
            team,
            format: this.draftFormGroup.controls.format.value,
            ruleset: this.draftFormGroup.controls.ruleset.value,
          }
        : null,
    );
  }

  createDraftFormGroup(data: Partial<LSDraftData>): DraftFormGroup {
    const context = this.context();
    const max = context?.max ?? data?.max ?? 12;
    const group = new DraftFormGroup({
      format: context?.format ?? data?.format,
      ruleset: context?.ruleset ?? data?.ruleset,
      draftName: data?.draftName ?? this.unusedName(context ? 'Plan' : 'Draft'),
      min: context?.min ?? data?.min,
      max,
      system: context
        ? context.totalPoints
          ? 'points'
          : 'tiers'
        : data?.system,
      totalPoints: context?.totalPoints ?? data?.totalPoints,
      team: new FormArray(
        Array(max)
          .fill(null)
          .map((_, index) => new TeamFormGroup(data?.team?.[index])),
      ),
    });
    group.baseline = data?.baseline ?? [];
    this.setDraftFormGroupSubscriptions(group);
    if (context) this.applyContext(group, context);
    return group;
  }

  private unusedName(prefix: string): string {
    const taken = new Set(
      (this.plannerForm?.controls.drafts.controls ?? []).map((group) =>
        normalizeName(group.controls.draftName.value),
      ),
    );
    let number = 1;
    while (taken.has(normalizeName(`${prefix} ${number}`))) number++;
    return `${prefix} ${number}`;
  }

  private applyContext(group: DraftFormGroup, context: PlannerContext): void {
    const controls = group.controls.team.controls;
    const present = new Set(
      controls.map((control) => control.controls.pokemon.value?.id),
    );

    for (const pokemon of context.roster) {
      if (group.baseline.includes(pokemon.id) || present.has(pokemon.id))
        continue;
      const slot = controls.find(
        (control) =>
          !control.controls.locked.value && !control.controls.pokemon.value?.id,
      );
      if (!slot) break;
      slot.controls.pokemon.setValue(
        { id: pokemon.id, name: pokemon.name },
        { emitEvent: false },
      );
    }
    group.baseline = context.roster.map((pokemon) => pokemon.id);
    group.controls.totalPoints.setValue(context.totalPoints, {
      emitEvent: false,
    });
    this.applyTiers(group, context);
  }

  private applyTiers(group: DraftFormGroup, context: PlannerContext): void {
    for (const control of group.controls.team.controls) {
      const id = control.controls.pokemon.value?.id;
      const entry = id ? context.tiers.get(id) : undefined;
      const tier = entry?.tier ?? '';
      const value = entry?.cost ?? null;
      if (control.controls.tier.value !== tier)
        control.controls.tier.setValue(tier, { emitEvent: false });
      if (control.controls.value.value !== value)
        control.controls.value.setValue(value, { emitEvent: false });
    }
  }

  private setDraftFormGroupSubscriptions(group: DraftFormGroup): void {
    group.controls.team.valueChanges.subscribe(() => {
      const context = this.context();
      if (context) this.applyTiers(group, context);
    });

    group.controls.max.valueChanges
      .pipe(debounceTime(500))
      .subscribe((value: number | null) => {
        if (!value) return;
        group.controls.min.setValidators([
          Validators.required,
          Validators.min(0),
          maxValidator(value),
        ]);
        group.controls.min.updateValueAndValidity();
        this.adjustTeamArray(group.controls.team, value);
      });

    merge(
      group.controls.ruleset.valueChanges.pipe(distinctUntilChanged()),
      group.controls.team.valueChanges,
    ).subscribe(() => this.updateDetails());
  }

  private adjustTeamArray(team: FormArray<TeamFormGroup>, newSize: number) {
    const currentSize = team.length;
    if (newSize > currentSize) {
      for (let i = currentSize; i < newSize; i++)
        team.push(new TeamFormGroup());
    } else if (newSize < currentSize) {
      for (let i = currentSize; i > newSize; i--) team.removeAt(i - 1);
    }
  }

  private setPanelRatio(ratio: number): void {
    this.panelCustomized.set(true);
    this.panelRatio.set(ratio);
  }

  private clampPanelRatio(ratio: number, containerWidth: number): number {
    const minRatio = Math.min(
      remToPx(MIN_PANEL_WIDTH_REM) / containerWidth,
      MAX_PANEL_RATIO,
    );
    return Math.min(MAX_PANEL_RATIO, Math.max(minRatio, ratio));
  }

  private isPointerResizing(event: PointerEvent): boolean {
    if (!this.isResizing()) return false;
    return (
      this.resizingPointerId === null ||
      event.pointerId === this.resizingPointerId
    );
  }

  private takeImportedDraft(): Partial<LSDraftData> | null {
    const draftParam = this.route.snapshot.queryParamMap.get('draft');
    if (!draftParam) return null;

    let importedDraft: Partial<LSDraftData> | null = null;
    try {
      const parsed = JSON.parse(decodeURIComponent(draftParam));
      importedDraft = this.sanitizeDraftData(parsed);
      importedDraft.draftName = importedDraft.draftName || 'Imported Draft';
      if (!importedDraft.draftName.endsWith('*')) {
        importedDraft.draftName += '*';
      }
    } catch (err) {
      console.warn('Invalid draft query param:', err);
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });

    return importedDraft;
  }

  private isValidTeamData(team: any): team is LSTeamData {
    return (
      typeof team.id === 'string' &&
      (typeof team.value === 'number' || team.value === null) &&
      typeof team.tier === 'string' &&
      (team.locked === undefined || typeof team.locked === 'boolean')
    );
  }

  private sanitizeDraftData(data: any): Partial<LSDraftData> {
    return {
      format: ensureString(data.format),
      ruleset: ensureString(data.ruleset),
      draftName: ensureString(data.draftName),
      min: ensureNumber(data.min),
      max: ensureNumber(data.max),
      system: ensureString(data.system),
      totalPoints: ensureNumber(data.totalPoints),
      team: Array.isArray(data.team)
        ? data.team.filter(this.isValidTeamData)
        : [],
      ...(Array.isArray(data.baseline)
        ? {
            baseline: data.baseline.filter(
              (id: unknown): id is string => typeof id === 'string',
            ),
          }
        : {}),
    };
  }

  private get storageKey(): string {
    return this.context()?.storageKey ?? FREE_STORAGE_KEY;
  }

  private getStoredPlannerData(): Partial<LSDraftData>[] {
    const parsedData = safeStorage.getJson<unknown>(this.storageKey);
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      return parsedData.map((data) => this.sanitizeDraftData(data));
    }
    return [{}];
  }

  private setStoredPlannerData(): void {
    const lsData = this.draftArray.controls.map((group) => {
      const name = group.controls.draftName.value;
      if (name.endsWith('*'))
        group.controls.draftName.setValue(name.slice(0, -1), {
          emitEvent: false,
        });
      const draft = group.getRawValue();

      return {
        format: draft.format,
        ruleset: draft.ruleset,
        draftName: draft.draftName,
        min: draft.min,
        max: draft.max,
        system: draft.system,
        totalPoints: draft.totalPoints,
        team: draft.team
          .map((pokemonData) => ({
            id: pokemonData.pokemon?.id,
            tier: pokemonData.tier,
            value: pokemonData.value,
            locked: pokemonData.locked,
          }))
          .filter(
            (pokemonData) =>
              pokemonData.id !== '' && this.isValidTeamData(pokemonData),
          ),
        ...(this.isTournament ? { baseline: group.baseline } : {}),
      };
    });
    const json = JSON.stringify(lsData);
    if (json !== this.lastSavedJson) {
      safeStorage.set(this.storageKey, json);
      this.plannerSync.push(this.storageKey, json);
      this.lastSavedJson = json;
    }
    this.hasUnsavedEdits.set(false);
  }
}

function normalizeName(name?: string): string {
  return (name ?? '').trim().toLowerCase();
}

function remToPx(rem: number): number {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return (
    rem *
    (Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16)
  );
}

function maxValidator(max: number) {
  return (control: { value: any; setValue: (value: number) => void }) => {
    if (control.value > max) {
      control.setValue(max);
      return { maxExceeded: true };
    }
    return null;
  };
}

export class TeamFormGroup extends FormGroup<{
  pokemon: FormControl<DraftPokemon | null>;
  tier: FormControl<string>;
  value: FormControl<number | null>;
  locked: FormControl<boolean>;
}> {
  constructor(data?: {
    name?: string;
    id?: string;
    value?: number | null;
    tier?: string;
    locked?: boolean;
  }) {
    super({
      tier: new FormControl(data?.tier ?? '', {
        nonNullable: true,
      }),
      value: new FormControl(data?.value ?? null),
      locked: new FormControl(data?.locked ?? false, {
        nonNullable: true,
      }),
      pokemon: new FormControl(
        data?.id
          ? { id: data.id, name: data.name ?? getNameByPid(data.id) }
          : null,
      ),
    });
  }

  clone(): TeamFormGroup {
    return new TeamFormGroup({
      id: this.controls.pokemon?.value?.id,
      tier: this.controls.tier.value,
      value: this.controls.value.value ?? undefined,
      locked: this.controls.locked.value,
    });
  }
}

export class DraftFormGroup extends FormGroup<{
  format: FormControl<string>;
  ruleset: FormControl<string>;
  draftName: FormControl<string>;
  min: FormControl<number>;
  max: FormControl<number>;
  system: FormControl<string>;
  totalPoints: FormControl<number>;
  team: FormArray<TeamFormGroup>;
}> {
  baseline: string[] = [];

  constructor(data: {
    format?: string;
    ruleset?: string;
    draftName?: string;
    min?: number;
    max?: number;
    system?: string;
    totalPoints?: number;
    team: FormArray<TeamFormGroup>;
  }) {
    super({
      format: new FormControl(data?.format ?? 'Singles', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      ruleset: new FormControl(data?.ruleset ?? DEFAULT_RULESET, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      draftName: new FormControl(data?.draftName ?? '', {
        nonNullable: true,
      }),
      min: new FormControl(data?.min ?? 10, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      max: new FormControl(data?.max ?? 12, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(0),
          Validators.max(18),
        ],
      }),
      system: new FormControl(data?.system ?? 'points', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      totalPoints: new FormControl(data?.totalPoints ?? 100, {
        nonNullable: true,
      }),
      team: data.team,
    });
  }

  clone(): DraftFormGroup {
    const copy = new DraftFormGroup({
      format: this.controls.format.value,
      ruleset: this.controls.ruleset.value,
      draftName: this.controls.draftName.value,
      min: this.controls.min.value,
      max: this.controls.max.value,
      system: this.controls.system.value,
      totalPoints: this.controls.totalPoints.value,
      team: new FormArray(
        this.controls.team.controls.map((pokemon) => pokemon.clone()),
      ),
    });
    copy.baseline = [...this.baseline];
    return copy;
  }
}
