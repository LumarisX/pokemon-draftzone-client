import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
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
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { debounceTime, distinctUntilChanged, merge } from 'rxjs';
import { DraftPokemon } from '../drafts/draft.model';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../drafts/matchup-overview/matchup-interface';
import { PokemonSearchCoreComponent } from '../tools/pokemon-search/pokemon-search-core/pokemon-search-core.component';
import { PlannerCoverageComponent } from './coverage/coverage.component';
import { MoveComponent } from './moves/moves.component';
import { PlannerService } from './planner.service';
import { PlannerSettingsComponent } from './settings/settings.component';
import { PlannerSummaryComponent } from './summary/summary.component';
import { PlannerTeamComponent } from './team/team.component';
import { PlannerTypechartComponent } from './typechart/typechart.component';
import { PlannerWidgetComponent } from './widget/planner-widget.component';

interface LSTeamData {
  id: string;
  value: number | null;
  tier: string;
  capt: boolean;
  drafted: boolean;
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
}

const MAX_DRAFTS = 9;
const AUTOSAVE_DEBOUNCE_MS = 800;
const LARGE_SCREEN_QUERY = '(min-width: 1024px)';
const DEFAULT_PANEL_RATIO = 0.34;
const MIN_PANEL_RATIO = 0.2;
const MAX_PANEL_RATIO = 0.6;

@Component({
  selector: 'pdz-planner',
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    IconComponent,
    LoadingComponent,
    MoveComponent,
    PlannerCoverageComponent,
    PlannerSettingsComponent,
    PlannerSummaryComponent,
    PlannerTeamComponent,
    PlannerTypechartComponent,
    PlannerWidgetComponent,
    PokemonSearchCoreComponent,
  ],
})
export class PlannerComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly plannerService = inject(PlannerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly maxDrafts = MAX_DRAFTS;

  plannerForm!: FormGroup<{ drafts: FormArray<DraftFormGroup> }>;

  selectedDraft = signal(0);
  typechart = signal<TypeChart>({ team: [] });
  summary = signal<Summary | undefined>(undefined);
  movechart = signal<MoveChart | undefined>(undefined);
  coverage = signal<Coverage | undefined>(undefined);

  isLargeScreen = signal(false);
  panelRatio = signal(DEFAULT_PANEL_RATIO);
  isResizing = signal(false);
  hasUnsavedEdits = signal(false);

  private lastSavedJson?: string;
  private resizingPointerId: number | null = null;
  private resizeStartX = 0;
  private resizeStartRatio = DEFAULT_PANEL_RATIO;
  private resizeContainerWidth = 1;
  private largeScreenQuery?: MediaQueryList;
  private readonly onLargeScreenChange = (event: MediaQueryListEvent) =>
    this.isLargeScreen.set(event.matches);

  hasAnalysis = computed(
    () =>
      !!this.summary() ||
      !!this.typechart().team.length ||
      !!this.movechart() ||
      !!this.coverage(),
  );

  panelFlex = computed(() => `0 0 ${(this.panelRatio() * 100).toFixed(2)}%`);

  ngOnInit(): void {
    const importedDraft = this.takeImportedDraft();
    const storedData = this.getStoredPlannerData().filter(
      (draft) => Object.keys(draft).length > 0,
    );

    let combinedData: Partial<LSDraftData>[];
    if (importedDraft) {
      const importedName = normalizeName(importedDraft.draftName);
      combinedData = [
        importedDraft,
        ...storedData.filter(
          (stored) => normalizeName(stored.draftName) !== importedName,
        ),
      ];
    } else {
      combinedData = storedData.length ? storedData : [{}];
    }

    this.plannerForm = this.fb.group({
      drafts: new FormArray<DraftFormGroup>(
        combinedData.map((data) => this.createDraftFormGroup(data)),
      ),
    });

    this.largeScreenQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    this.isLargeScreen.set(this.largeScreenQuery.matches);
    this.largeScreenQuery.addEventListener('change', this.onLargeScreenChange);

    this.draftArray.valueChanges.subscribe(() =>
      this.hasUnsavedEdits.set(true),
    );
    this.draftArray.valueChanges
      .pipe(debounceTime(AUTOSAVE_DEBOUNCE_MS))
      .subscribe((draftArrayData) => this.setStoredPlannerData(draftArrayData));

    this.updateDetails();
  }

  ngOnDestroy(): void {
    this.flushPendingSave();
    this.largeScreenQuery?.removeEventListener(
      'change',
      this.onLargeScreenChange,
    );
  }

  /**
   * Autosave is debounced, so edits made in the last moment before the tab goes
   * away would otherwise be dropped. `visibilitychange` covers mobile, where
   * `beforeunload` is unreliable.
   */
  @HostListener('window:beforeunload')
  @HostListener('document:visibilitychange')
  flushPendingSave(): void {
    if (!this.hasUnsavedEdits()) return;
    this.setStoredPlannerData(this.draftArray.getRawValue());
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
    this.selectedDraft.set(index);
    this.updateDetails();
  }

  deletePlan(index: number): void {
    this.draftArray.removeAt(index);
    this.selectDraft(0);
  }

  addDraft(): void {
    if (this.isAtDraftLimit) return;
    this.draftArray.push(this.createDraftFormGroup({}));
    this.selectDraft(this.draftSize - 1);
  }

  copyToNew(index: number): void {
    if (this.isAtDraftLimit) return;
    const draftCopy = this.draftArray.at(index).clone();
    this.setDraftFormGroupSubscriptions(draftCopy);
    this.draftArray.push(draftCopy);
    this.selectDraft(this.draftSize - 1);
  }

  onPanelResizeStart(event: PointerEvent): void {
    const splitter = event.currentTarget as HTMLElement | null;
    const container = splitter?.closest('.planner__body') as HTMLElement | null;
    if (!splitter || !container) return;

    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);

    this.resizingPointerId = event.pointerId;
    this.resizeStartX = event.clientX;
    this.resizeStartRatio = this.panelRatio();
    this.resizeContainerWidth = Math.max(container.clientWidth, 1);
    this.isResizing.set(true);
  }

  onPanelSplitterKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.05 : 0.02;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.panelRatio.update((ratio) => clampPanelRatio(ratio - step));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.panelRatio.update((ratio) => clampPanelRatio(ratio + step));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.panelRatio.set(DEFAULT_PANEL_RATIO);
    }
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (!this.isPointerResizing(event)) return;
    const deltaX = event.clientX - this.resizeStartX;
    this.panelRatio.set(
      clampPanelRatio(
        this.resizeStartRatio + deltaX / this.resizeContainerWidth,
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

    if (!team.length) {
      this.typechart.set({ team: [] });
      this.summary.set(undefined);
      this.movechart.set(undefined);
      this.coverage.set(undefined);
      return;
    }

    this.plannerService
      .getPlannerDetails(
        team,
        this.draftFormGroup.controls.format.value,
        this.draftFormGroup.controls.ruleset.value,
      )
      .subscribe((planner) => {
        this.typechart.set(planner.typechart);
        this.summary.set(planner.summary);
        this.movechart.set(planner.movechart);
        this.coverage.set(planner.coverage);
      });
  }

  createDraftFormGroup(data: Partial<LSDraftData>): DraftFormGroup {
    const group = new DraftFormGroup({
      format: data?.format,
      ruleset: data?.ruleset,
      draftName: data?.draftName ?? 'Draft ' + (this.draftSize + 1),
      min: data?.min,
      max: data?.max,
      system: data?.system,
      totalPoints: data?.totalPoints,
      team: new FormArray(
        Array(data?.max ?? 12)
          .fill(null)
          .map((_, index) => new TeamFormGroup(data?.team?.[index])),
      ),
    });
    this.setDraftFormGroupSubscriptions(group);
    return group;
  }

  private setDraftFormGroupSubscriptions(group: DraftFormGroup): void {
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
      typeof team.capt === 'boolean' &&
      typeof team.drafted === 'boolean'
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
    };
  }

  private getStoredPlannerData(): Partial<LSDraftData>[] {
    const storedPlannerData = localStorage.getItem('plannerData');
    try {
      const parsedData = JSON.parse(storedPlannerData!);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData.map((data) => this.sanitizeDraftData(data));
      }
    } catch {
      console.warn('Invalid plannerData format in localStorage');
    }
    return [{}];
  }

  private setStoredPlannerData(
    draftArrayData: Partial<{
      format: string;
      ruleset: string;
      draftName: string;
      min: number;
      max: number;
      system: string;
      totalPoints: number;
      team: Partial<{
        pokemon: DraftPokemon | null;
        capt: boolean;
        tier: string;
        value: number | null;
        drafted: boolean;
      }>[];
    }>[],
  ): void {
    for (let i = 0; i < draftArrayData.length; i++) {
      const name = draftArrayData[i]?.draftName;
      if (!name?.endsWith('*')) continue;
      const control = this.draftArray?.at(i);
      if (!control?.controls?.draftName) continue;
      const trimmed = name.slice(0, -1);
      control.controls.draftName.setValue(trimmed, { emitEvent: false });
      draftArrayData[i].draftName = trimmed;
    }

    const lsData = draftArrayData.map((draft) => ({
      format: draft.format,
      ruleset: draft.ruleset,
      draftName: draft.draftName,
      min: draft.min,
      max: draft.max,
      system: draft.system,
      totalPoints: draft.totalPoints,
      team: draft.team
        ?.map((pokemonData) => ({
          id: pokemonData.pokemon?.id,
          capt: pokemonData.capt,
          tier: pokemonData.tier,
          value: pokemonData.value,
          drafted: pokemonData.drafted,
        }))
        .filter(
          (pokemonData) =>
            pokemonData.id !== '' && this.isValidTeamData(pokemonData),
        ),
    }));
    // `valueChanges` fires for edits that serialize identically (typing a digit
    // then deleting it, toggling a checkbox back). Comparing is ~10x cheaper
    // than the write, so skip those rather than round-trip localStorage.
    const json = JSON.stringify(lsData);
    if (json !== this.lastSavedJson) {
      localStorage.setItem('plannerData', json);
      this.lastSavedJson = json;
    }
    this.hasUnsavedEdits.set(false);
  }
}

function normalizeName(name?: string): string {
  return (name ?? '').trim().toLowerCase();
}

function clampPanelRatio(value: number): number {
  return Math.max(MIN_PANEL_RATIO, Math.min(MAX_PANEL_RATIO, value));
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
  capt: FormControl<boolean>;
  tier: FormControl<string>;
  value: FormControl<number | null>;
  drafted: FormControl<boolean>;
}> {
  constructor(data?: {
    name?: string;
    id?: string;
    value?: number | null;
    tier?: string;
    capt?: boolean;
    drafted?: boolean;
  }) {
    super({
      capt: new FormControl(data?.capt ?? false, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      tier: new FormControl(data?.tier ?? '', {
        nonNullable: true,
      }),
      value: new FormControl(data?.value ?? null),
      drafted: new FormControl(data?.drafted ?? false, {
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
      capt: this.controls.capt.value,
      tier: this.controls.tier.value,
      value: this.controls.value.value ?? undefined,
      drafted: this.controls.drafted.value,
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
      ruleset: new FormControl(data?.ruleset ?? 'Gen9 NatDex', {
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
    return new DraftFormGroup({
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
  }
}
