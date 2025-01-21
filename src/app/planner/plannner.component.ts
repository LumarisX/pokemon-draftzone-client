import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
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
import { RouterModule } from '@angular/router';
import { DataService } from '../api/data.service';
import { PlannerService } from '../api/planner.service';
import { Type } from '../data';
import { getPidByName, Namedex, nameList, PokemonId } from '../data/namedex';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { LoadingComponent } from '../images/loading/loading.component';
import { SpriteComponent } from '../images/sprite/sprite.component';
import { CompactSVG } from '../images/svg-components/compact.component';
import { CopySVG } from '../images/svg-components/copy.component';
import { GearSVG } from '../images/svg-components/gear.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { TrashSVG } from '../images/svg-components/trash.component';
import { Pokemon } from '../interfaces/draft';
import {
  Coverage,
  MoveChart,
  Summary,
  TypeChart,
} from '../matchup-overview/matchup-interface';
import { FinderCoreComponent } from '../tools/finder/finder-core.component';
import { SelectSearchComponent } from '../util/dropdowns/select/select-search.component';
import { PlannerCoverageComponent } from './coverage/coverage.component';
import { MoveComponent } from './moves/moves.component';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';

type Planner = {
  summary: Summary;
  typechart: TypeChart;
  movechart: MoveChart;
  coverage: Coverage;
  recommended: {
    pokemon: Pokemon[];
    types: Type[][];
  };
};

@Component({
  selector: 'planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    TypechartComponent,
    SummaryComponent,
    MoveComponent,
    ReactiveFormsModule,
    FormsModule,
    PlusSVG,
    TrashSVG,
    GearSVG,
    SpriteComponent,
    MatTabsModule,
    FinderCoreComponent,
    SelectSearchComponent,
    CompactSVG,
    CopySVG,
    PlannerCoverageComponent,
    LoadingComponent,
  ],
  animations: [
    trigger('growIn', [
      state('void', style({ height: '0', overflow: 'hidden' })),
      state('*', style({ height: '*' })),
      transition('void <=> *', [animate('0.5s ease-in-out')]),
    ]),
  ],
})
export class PlannerComponent implements OnInit {
  plannerForm!: FormGroup;
  typechart: TypeChart = {
    team: [],
  };
  recommended: {
    pokemon: Pokemon[];
    types: Type[][];
  } = {
    pokemon: [],
    types: [],
  };
  team: PokemonId[] = [];
  summary: Summary = {
    team: [],
    teamName: '',
    stats: { mean: {}, median: {}, max: {} },
  };
  coverage!: Coverage;
  selectedDraft = 0;
  formats: string[] = [];
  rulesets: string[] = [];
  movechart: MoveChart = [];
  draftSize = 0;
  settings = true;
  draftPath = DraftOverviewPath;
  names = nameList();
  isMediumScreen = false;

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    // Populate form data from localStorage if available
    const storedPlannerData = localStorage.getItem('plannerData');
    if (!storedPlannerData || storedPlannerData === '[]') {
      this.plannerForm = this.fb.group({
        drafts: this.fb.array([this.createDraftFormGroup()]),
      });
    } else {
      let data = JSON.parse(storedPlannerData);
      this.plannerForm = this.fb.group({
        drafts: this.fb.array(
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
                value: string;
                tier: string;
                capt: boolean;
                drafted: boolean;
              }[];
            }) => this.createDraftFormGroup(value),
          ),
        ),
      });
      this.isMediumScreen = window.innerWidth >= 768;
    }

    this.updateDetails();

    // Listen for form changes and save to localStorage
    this.draftArray.valueChanges.subscribe((value) => {
      localStorage.setItem('plannerData', JSON.stringify(value));
    });

    // Initialize formats and rulesets
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  get isPoints() {
    return this.getDraftFormGroup().get('system')?.value === 'points';
  }

  get remainingPoints() {
    let total: number = 0;
    for (let control of this.teamFormArray?.controls) {
      total += control.get('value')?.value;
    }
    return this.getDraftFormGroup().get('totalPoints')?.value - total;
  }

  get tieredCount() {
    let total: number = 0;
    for (let control of this.teamFormArray?.controls) {
      let value = control.get('id')?.value;
      if (value != null && value != '') {
        total++;
      }
    }
    return total;
  }

  get remainingPokemon() {
    let mons = this.getDraftFormGroup().get('min')?.value - this.tieredCount;
    return mons > 1 ? mons : 1;
  }

  get teamFormArray(): FormArray {
    let array = this.getDraftFormGroup().get('team') as FormArray | null;
    if (!(array instanceof FormArray) || array.length < 1) {
      array = this.fb.array([this.createDraftFormGroup()]);
    }
    return array;
  }

  get draftArray(): FormArray {
    let array = this.plannerForm.get('drafts') as FormArray | null;
    if (!(array instanceof FormArray) || array.length < 1) {
      array = this.fb.array([this.createDraftFormGroup()]);
    }
    return array;
  }

  deletePlan(index: number) {
    this.draftArray.removeAt(index);
    this.draftSize--;
    this.selectedDraft = 0;
    this.updateDetails();
  }

  updateDetails() {
    this.team = [];
    for (let pokemon of this.teamFormArray.controls) {
      let id = pokemon.get('id')?.value;
      if (id in Namedex) {
        this.team.push(id);
      }
    }
    if (this.team.length == 0) {
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
      this.recommended = { pokemon: [], types: [] };
    } else {
      this.plannerService
        .getPlannerDetails(
          this.team,
          this.getDraftFormGroup().get('format')?.value,
          this.getDraftFormGroup().get('ruleset')?.value,
        )
        .subscribe((data) => {
          let planner = <Planner>data;
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
      value: string;
      tier: string;
      capt: boolean;
      drafted: boolean;
    }[];
  }): FormGroup {
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
    const maxFormControl = group.get('max');
    maxFormControl?.valueChanges.subscribe((value: number | null) => {
      if (value) {
        group
          .get('min')
          ?.setValidators([
            Validators.required,
            Validators.min(0),
            this.maxValidator(value),
          ]);
        group.get('min')?.updateValueAndValidity();
      }
    });
    maxFormControl?.valueChanges.subscribe((value: number | null) => {
      if (value) this.adjustTeamArray(group.teamArray, value);
    });
    group.get('ruleset')?.valueChanges.subscribe(() => {
      this.updateDetails();
    });
    this.draftSize++;
    return group;
  }

  createTeamFormGroup(data?: {
    name: string;
    id: string;
    value: string | null;
    tier: string;
    capt: boolean;
    drafted: boolean;
  }): TeamFormGroup {
    const teamFormGroup = new TeamFormGroup(data);
    teamFormGroup.get('name')?.valueChanges.subscribe((name) => {
      if (name !== null) {
        let id = getPidByName(name);
        if (teamFormGroup.get('id')?.value != id) {
          teamFormGroup.get('id')?.setValue(id, { emitEvent: false });
        }
      }
    });
    teamFormGroup.get('id')?.valueChanges.subscribe((id) => {
      this.updateDetails();
    });
    return teamFormGroup;
  }

  addDraft() {
    this.draftArray.push(this.createDraftFormGroup());
    this.selectedDraft = this.draftSize - 1;
    this.updateDetails();
  }

  getDraftFormGroup(): FormGroup {
    return this.draftArray.at(this.selectedDraft) as FormGroup;
  }

  minMaxStyle(i: number) {
    return i < this.getDraftFormGroup().get('min')?.value
      ? 'border-menu-500'
      : 'border-menu-300 text-menu-500';
  }

  switchDrafts(index: number) {
    this.selectedDraft = index;
    this.updateDetails();
  }

  copyToNew(index: number) {
    let draft = this.draftArray.at(index);
    let draftCopy = this.fb.group({
      format: [draft.get('format')?.value, Validators.required],
      ruleset: [draft.get('ruleset')?.value, Validators.required],
      draftName: [draft.get('draftName')?.value + ' (Copy)'],
      min: [draft.get('min')?.value, [Validators.required, Validators.min(0)]],
      max: [
        draft.get('max')?.value,
        [Validators.required, Validators.min(0), Validators.max(18)],
      ],
      system: [draft.get('system')?.value, Validators.required],
      totalPoints: [draft.get('totalPoints')?.value],
      team: this.fb.array(
        (draft.get('team') as FormArray).controls.map((control) =>
          this.fb.group({
            id: [control.get('id')?.value, Validators.required],
            name: [control.get('name')?.value, Validators.required],
            capt: [control.get('capt')?.value, Validators.required],
            tier: [control.get('tier')?.value],
            value: [control.get('value')?.value],
            drafted: [control.get('drafted')?.value],
          }),
        ),
      ),
    });

    this.draftArray.push(draftCopy);
    this.selectedDraft = this.draftSize;
    this.updateDetails();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isMediumScreen = window.innerWidth >= 768;
  }
}

class TeamFormGroup extends FormGroup<{
  name: FormControl<string | null>;
  id: FormControl<string | null>;
  capt: FormControl<boolean | null>;
  tier: FormControl<string | null>;
  value: FormControl<string | null>;
  drafted: FormControl<boolean | null>;
}> {
  constructor(data?: {
    name?: string;
    id?: string;
    value?: string | null;
    tier?: string;
    capt: boolean;
    drafted?: boolean;
  }) {
    super({
      id: new FormControl(data?.id ?? '', Validators.required),
      name: new FormControl(data?.name ?? '', Validators.required),
      capt: new FormControl(data?.capt ?? false, Validators.required),
      tier: new FormControl(data?.tier ?? ''),
      value: new FormControl(data?.value ?? null),
      drafted: new FormControl(data?.drafted ?? false),
    });
  }
}

class DraftFormGroup extends FormGroup {
  teamArray: FormArray<TeamFormGroup>;
  constructor(data: {
    format?: string;
    ruleset?: string;
    draftName: string;
    min?: number;
    max?: number;
    system?: string;
    totalPoints?: number;
    team: FormArray<TeamFormGroup>;
  }) {
    const max = data?.max ?? 12;

    super({
      format: new FormControl(data?.format ?? 'Singles', Validators.required),
      ruleset: new FormControl(
        data?.ruleset ?? 'Gen9 NatDex',
        Validators.required,
      ),
      draftName: new FormControl(data?.draftName),
      min: new FormControl(data?.min ?? 10, [
        Validators.required,
        Validators.min(0),
      ]),
      max: new FormControl(max, [
        Validators.required,
        Validators.min(0),
        Validators.max(18),
      ]),
      system: new FormControl(data?.system ?? 'points', Validators.required),
      totalPoints: new FormControl(data?.totalPoints ?? 100),
      team: data.team,
    });
    this.teamArray = data.team;
  }
}
