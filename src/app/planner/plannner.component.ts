import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { PlannerService } from '../api/planner.service';
import { Type } from '../data';
import { getNameByPid, getPidByName } from '../data/namedex';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../drafts/matchup-overview/matchup-interface';
import { LoadingComponent } from '../images/loading/loading.component';
import { CopySVG } from '../images/svg-components/copy.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { TrashSVG } from '../images/svg-components/trash.component';
import { Pokemon } from '../interfaces/draft';
import { FinderCoreComponent } from '../tools/finder/finder-core.component';
import { PlannerCoverageComponent } from './coverage/coverage.component';
import { MoveComponent } from './moves/moves.component';
import { PlannerSettingsComponent } from './settings/settings.component';
import { SummaryComponent } from './summary/summary.component';
import { PlannerTeamComponent } from './team/team.component';
import { TypechartComponent } from './typechart/typechart.component';

@Component({
  selector: 'planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [
    CommonModule,
    TypechartComponent,
    SummaryComponent,
    MoveComponent,
    ReactiveFormsModule,
    FormsModule,
    PlusSVG,
    TrashSVG,
    MatTabsModule,
    FinderCoreComponent,
    CopySVG,
    PlannerCoverageComponent,
    PlannerSettingsComponent,
    PlannerTeamComponent,
    LoadingComponent,
  ],
})
export class PlannerComponent implements OnInit {
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
  summary: Summary = {
    team: [],
    teamName: '',
    stats: { mean: {}, median: {}, max: {} },
  };
  coverage?: Coverage;
  selectedDraft = 0;

  movechart: MoveChart = [];
  isLargeScreen = false;

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
  ) {}

  ngOnInit(): void {
    // Populate form data from localStorage if available
    const storedPlannerData = localStorage.getItem('plannerData');
    if (!storedPlannerData || storedPlannerData === '[]') {
      this.plannerForm = this.fb.group({
        drafts: this.fb.array<DraftFormGroup>([this.createDraftFormGroup()]),
      });
    } else {
      let data = JSON.parse(storedPlannerData);
      this.plannerForm = this.fb.group({
        drafts: this.fb.array<DraftFormGroup>(
          data.map(
            (value: {
              format: string;
              ruleset: string;
              draftName: string;
              min: number;
              max: number;
              system: string;
              totalPoints: number;
              team: {
                name: string;
                id: string;
                value: number;
                tier: string;
                capt: boolean;
                drafted: boolean;
              }[];
            }) => this.createDraftFormGroup(value),
          ),
        ),
      });
      this.isLargeScreen = window.innerWidth >= 1024;
    }

    this.updateDetails();

    // Listen for form changes and save to localStorage
    this.draftArray.valueChanges.subscribe((value) => {
      localStorage.setItem('plannerData', JSON.stringify(value));
    });
  }

  get isPoints() {
    return this.draftFormGroup.controls.system.value === 'points';
  }

  get remainingPoints() {
    let total: number = 0;
    for (let control of this.teamFormArray.controls) {
      total += control.controls.value.value;
    }
    return this.draftFormGroup.controls.totalPoints.value - total;
  }

  get draftSize() {
    return this.plannerForm?.controls.drafts.length ?? 0;
  }

  get teamFormArray() {
    return this.draftFormGroup.controls.team;
  }

  get teamIds() {
    return this.teamFormArray.value
      .map((pokemon) => pokemon.id)
      .filter((id) => id != undefined)
      .filter((id) => id != '');
  }

  get draftArray() {
    let array = this.plannerForm.controls.drafts;
    if (array.length < 1) {
      array = this.fb.array([this.createDraftFormGroup()]);
    }
    return array;
  }

  deletePlan(index: number) {
    this.draftArray.removeAt(index);
    this.selectedDraft = 0;
    this.updateDetails();
  }

  updateDetails() {
    const team = this.teamIds;
    if (team.length == 0) {
      this.typechart = { team: [] };
      this.summary = {
        team: [],
        teamName: '',
        stats: {
          mean: {},
          median: {},
          max: {},
        },
      };
      this.movechart = [];
      this.recommended = undefined;
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
          this.updateDetails();
        }
      }
    }
  }

  createDraftFormGroup(data?: {
    format: string;
    ruleset: string;
    draftName: string;
    min: number;
    max: number;
    system: string;
    totalPoints: number;
    team: {
      name: string;
      id: string;
      value: number;
      tier: string;
      capt: boolean;
      drafted: boolean;
    }[];
  }) {
    const teamArray: FormArray<TeamFormGroup> = new FormArray(
      data?.team?.map((mon) => this.createTeamFormGroup(mon)) ??
        Array.from({ length: data?.max ?? 12 }, () =>
          this.createTeamFormGroup(),
        ),
    );
    const group = new DraftFormGroup({
      format: data?.format,
      ruleset: data?.ruleset,
      draftName: 'Draft ' + (this.draftSize + 1),
      min: data?.min,
      max: data?.max,
      system: data?.system,
      totalPoints: data?.totalPoints,
      team: teamArray,
    });
    group.controls.max.valueChanges.subscribe((value: number | null) => {
      if (value) {
        group.controls.min.setValidators([
          Validators.required,
          Validators.min(0),
          this.maxValidator(value),
        ]);
        group.controls.min.updateValueAndValidity();
      }
    });
    group.controls.max.valueChanges.subscribe((value: number | null) => {
      if (value) this.adjustTeamArray(group.controls.team, value);
    });
    group.controls.ruleset.valueChanges.subscribe(() => {
      this.updateDetails();
    });
    return group;
  }

  createTeamFormGroup(data?: {
    name: string;
    id: string;
    value: number;
    tier: string;
    capt: boolean;
    drafted: boolean;
  }): TeamFormGroup {
    const teamFormGroup = new TeamFormGroup(data);
    teamFormGroup.controls.name.valueChanges.subscribe((name) => {
      if (name !== null) {
        const id = getPidByName(name) ?? '';
        if (teamFormGroup.controls.id.value != id) {
          teamFormGroup.controls.id.setValue(id, { emitEvent: false });
        }
      }
    });
    teamFormGroup.controls.id.valueChanges.subscribe((id) => {
      this.updateDetails();
    });
    return teamFormGroup;
  }

  addDraft() {
    this.draftArray.push(this.createDraftFormGroup());
    this.selectedDraft = this.draftSize - 1;
    this.updateDetails();
  }

  get draftFormGroup() {
    return this.draftArray.at(this.selectedDraft);
  }

  minMaxStyle(i: number) {
    return i < this.draftFormGroup.controls.min.value
      ? 'border-menu-500'
      : 'border-menu-300 text-menu-500';
  }

  switchDrafts(index: number) {
    this.selectedDraft = index;
    this.updateDetails();
  }

  copyToNew(index: number) {
    let draft = this.draftArray.at(index);
    const draftCopy = new DraftFormGroup({
      format: draft.controls.format.value,
      ruleset: draft.controls.ruleset.value,
      draftName: draft.controls.draftName.value,
      min: draft.controls.min.value,
      max: draft.controls.max.value,
      system: draft.controls.system.value,
      totalPoints: draft.controls.totalPoints.value,
      team: new FormArray(
        draft.controls.team.controls.map(
          (pokemon) =>
            new TeamFormGroup({
              id: pokemon.controls.id.value,
              name: pokemon.controls.name.value,
              capt: pokemon.controls.capt.value,
              tier: pokemon.controls.tier.value,
              value: pokemon.controls.value.value,
              drafted: pokemon.controls.drafted.value,
            }),
        ),
      ),
    });
    this.draftArray.push(draftCopy);
    this.selectedDraft = this.draftSize - 1;
    this.updateDetails();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isLargeScreen = window.innerWidth >= 1024;
  }
}

export class TeamFormGroup extends FormGroup<{
  name: FormControl<string>;
  id: FormControl<string>;
  pokemon: FormControl<Pokemon | null>;
  capt: FormControl<boolean>;
  tier: FormControl<string>;
  value: FormControl<number>;
  drafted: FormControl<boolean>;
}> {
  constructor(data?: {
    name?: string;
    id?: string;
    value?: number;
    tier?: string;
    capt?: boolean;
    drafted?: boolean;
  }) {
    super({
      id: new FormControl(data?.id ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      name: new FormControl(data?.name ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      capt: new FormControl(data?.capt ?? false, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      tier: new FormControl(data?.tier ?? '', {
        nonNullable: true,
      }),
      value: new FormControl(data?.value ?? 0, {
        nonNullable: true,
      }),
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
}
