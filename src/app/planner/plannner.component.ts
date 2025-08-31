import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  merge,
} from 'rxjs';
import { PlannerService } from '../services/planner.service';
import { Type } from '../data';
import { getNameByPid } from '../data/namedex';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../drafts/matchup-overview/matchup-interface';
import { LoadingComponent } from '../images/loading/loading.component';
import { Pokemon } from '../interfaces/draft';
import { FinderCoreComponent } from '../tools/finder/finder-core.component';
import { ensureNumber, ensureString } from '../util';
import { PlannerCoverageComponent } from './coverage/coverage.component';
import { MoveComponent } from './moves/moves.component';
import { PlannerSettingsComponent } from './settings/settings.component';
import { PlannerSummaryComponent } from './summary/summary.component';
import { PlannerTeamComponent } from './team/team.component';
import { PlannerTypechartComponent } from './typechart/typechart.component';
import { PlannerSizeWarn } from './warn.component';

interface LSTeamData {
  id: string;
  value: number | null;
  tier: string;
  capt: boolean;
  drafted: boolean;
}

interface LSDraftData {
  format: string;
  ruleset: string;
  draftName: string;
  min: number;
  max: number;
  system: string;
  totalPoints: number;
  team: LSTeamData[];
}

@Component({
  selector: 'planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [
    CommonModule,
    PlannerTypechartComponent,
    PlannerSummaryComponent,
    MoveComponent,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatDialogModule,
    FinderCoreComponent,
    PlannerCoverageComponent,
    PlannerSettingsComponent,
    PlannerTeamComponent,
    LoadingComponent,
  ],
})
export class PlannerComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private plannerService = inject(PlannerService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  plannerForm!: FormGroup<{ drafts: FormArray<DraftFormGroup> }>;
  typechart: TypeChart = {
    team: [],
  };
  recommended?: {
    all: {
      pokemon: Pokemon[];
      types: Type[][];
    };
    unique: {
      pokemon: Pokemon[];
      types: Type[][];
    };
  };
  summary?: Summary;
  coverage?: Coverage;
  selectedDraft = new BehaviorSubject<number>(0);
  movechart: MoveChart = [];
  isLargeScreen = false;

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
        pokemon: Pokemon | null;
        capt: boolean;
        tier: string;
        value: number | null;
        drafted: boolean;
      }>[];
    }>[],
  ) {
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
    localStorage.setItem('plannerData', JSON.stringify(lsData));
  }

  ngOnInit(): void {
    const storedData = this.getStoredPlannerData();
    this.plannerForm = this.fb.group({
      drafts: new FormArray<DraftFormGroup>(
        storedData.map((data) => this.createDraftFormGroup(data)),
      ),
    });
    this.isLargeScreen = window.innerWidth >= 1024;

    this.selectedDraft
      .asObservable()
      .subscribe((value) => this.updateDetails());

    this.draftArray.valueChanges
      .pipe(debounceTime(3000))
      .subscribe((draftArrayData) => {
        this.setStoredPlannerData(draftArrayData);
      });
  }

  @ViewChildren(MatTab) tabs!: QueryList<MatTab>;
  tabIndex: number | null = 0;

  ngAfterViewInit() {
    this.tabs.changes.subscribe(() => {
      this.tabIndex = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.tabIndex = 0;
      });
    });
  }

  get draftSize(): number {
    return this.plannerForm?.controls.drafts.length ?? 0;
  }

  get teamFormArray(): FormArray<TeamFormGroup> {
    return this.draftFormGroup.controls.team;
  }

  get draftArray(): FormArray<DraftFormGroup> {
    let array = this.plannerForm.controls.drafts;
    if (array.length < 1) {
      array = new FormArray<DraftFormGroup>([this.createDraftFormGroup({})]);
    }
    return array;
  }

  deletePlan(index: number) {
    this.draftArray.removeAt(index);
    this.selectedDraft.next(0);
  }

  updateDetails() {
    const team = this.teamFormArray.controls
      .filter(
        (group) =>
          group.controls.pokemon.valid &&
          group.controls.pokemon.value !== null &&
          group.controls.pokemon.value.id !== '',
      )
      .map((group) => group.controls.pokemon.value!.id);

    if (team.length == 0) {
      this.typechart = { team: [] };
      this.summary = undefined;
      this.movechart = [];
      this.recommended = undefined;
      this.coverage = undefined;
    } else {
      this.plannerService
        .getPlannerDetails(
          team,
          this.draftFormGroup.controls.format.value,
          this.draftFormGroup.controls.ruleset.value,
        )
        .subscribe((planner) => {
          this.typechart = planner.typechart;
          this.summary = planner.summary;
          this.movechart = planner.movechart;
          this.recommended = planner.recommended;
          this.coverage = planner.coverage;
        });
    }
  }

  resultSelected(formGroup: AbstractControl, result: Pokemon | null) {
    if (result) {
      formGroup.patchValue({ name: result.name, id: result.id });
    } else {
      formGroup.patchValue({ name: null, id: null });
    }
  }

  maxValidator(max: number) {
    return (control: { value: any; setValue: (arg0: number) => void }) => {
      const value = control.value;
      if (value > max) {
        control.setValue(max);
        return { maxExceeded: true };
      }
      return null;
    };
  }

  adjustTeamArray(team: FormArray | undefined, newSize: number): void {
    if (team) {
      const currentSize = team.length;
      if (newSize > currentSize) {
        for (let i = currentSize; i < newSize; i++) {
          team.push(this.createTeamFormGroup());
        }
      } else if (newSize < currentSize) {
        for (let i = currentSize; i > newSize; i--) {
          team.removeAt(i - 1);
        }
      }
    }
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
          .map((_, k) => this.createTeamFormGroup(data?.team?.[k])),
      ),
    });
    this.setDraftFormGroupSubscriptions(group);
    return group;
  }

  setDraftFormGroupSubscriptions(group: DraftFormGroup) {
    group.controls.max.valueChanges
      .pipe(debounceTime(500))
      .subscribe((value: number | null) => {
        if (value) {
          group.controls.min.setValidators([
            Validators.required,
            Validators.min(0),
            this.maxValidator(value),
          ]);
          group.controls.min.updateValueAndValidity();
          this.adjustTeamArray(group.controls.team, value);
        }
      });
    merge(
      group.controls.ruleset.valueChanges.pipe(distinctUntilChanged()),
      group.controls.team.valueChanges,
    ).subscribe(() => this.updateDetails());
  }

  openDialog(
    enterAnimationDuration: string,
    exitAnimationDuration: string,
  ): void {
    this.dialog.open(PlannerSizeWarn, {
      width: '250px',
      panelClass: 'dialog-warn',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }

  createTeamFormGroup(data?: LSTeamData): TeamFormGroup {
    return new TeamFormGroup(data);
  }

  addDraft(draft: DraftFormGroup) {
    if (this.draftSize >= 9) {
      this.openDialog('100ms', '100ms');
      return;
    }
    this.draftArray.push(draft);
    this.selectedDraft.next(this.draftSize - 1);
  }

  get draftFormGroup() {
    return this.draftArray.at(this.selectedDraft.value);
  }

  copyToNew(index: number) {
    const draftCopy = this.draftArray.at(index).clone();
    this.setDraftFormGroupSubscriptions(draftCopy);
    this.draftArray.push(draftCopy);
    this.selectedDraft.next(this.draftSize - 1);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isLargeScreen = window.innerWidth >= 1024;
  }
}

export class TeamFormGroup extends FormGroup<{
  pokemon: FormControl<Pokemon | null>;
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
    const format = new FormControl(data?.format ?? 'Singles', {
      nonNullable: true,
      validators: [Validators.required],
    });
    const ruleset = new FormControl(data?.ruleset ?? 'Gen9 NatDex', {
      nonNullable: true,
      validators: [Validators.required],
    });
    const draftName = new FormControl(data?.draftName ?? '', {
      nonNullable: true,
    });
    const min = new FormControl(data?.min ?? 10, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    });
    const max = new FormControl(data?.max ?? 12, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(18)],
    });
    const system = new FormControl(data?.system ?? 'points', {
      nonNullable: true,
      validators: [Validators.required],
    });
    const totalPoints = new FormControl(data?.totalPoints ?? 100, {
      nonNullable: true,
    });
    const team = data.team;
    super({
      format,
      ruleset,
      draftName,
      min,
      max,
      system,
      totalPoints,
      team,
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
