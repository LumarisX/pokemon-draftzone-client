import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../api/data.service';
import { PlannerService } from '../api/planner.service';
import { Type } from '../data';
import { getPidByName, Namedex, nameList, PokemonId } from '../data/namedex';
import { SpriteComponent } from '../images/sprite.component';
import { CompactSVG } from '../images/svg-components/compact.component';
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
import { MoveComponent } from './moves/moves.component';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';
import { CopySVG } from '../images/svg-components/copy.component';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { PlannerCoverageComponent } from './coverage/coverage.component';

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
    FinderCoreComponent,
    SelectSearchComponent,
    CompactSVG,
    CopySVG,
    PlannerCoverageComponent,
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
  tabSelected = 0;
  selectedDraft = 0;
  formats: string[] = [];
  rulesets: string[] = [];
  movechart: MoveChart = [];
  draftSize = 0;
  settings = true;
  draftPath = DraftOverviewPath;
  names = nameList();

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
    return this.getDraftFormGroup().get('team') as FormArray;
  }

  get draftArray(): FormArray {
    return this.plannerForm.get('drafts') as FormArray;
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

  createDraftFormGroup(
    data: {
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
    } = {
      format: 'Singles',
      ruleset: 'Gen9 NatDex',
      draftName: 'Draft ' + (this.draftSize + 1),
      min: 10,
      max: 12,
      system: 'points',
      totalPoints: 100,
      team: [],
    },
  ): FormGroup {
    let teamArray = this.fb.array(
      data.team.map((mon) => this.createTeamFormGroup(mon)),
    );
    let group = this.fb.group({
      format: [data.format, Validators.required],
      ruleset: [data.ruleset, Validators.required],
      draftName: [data.draftName],
      min: [data.min, [Validators.required, Validators.min(0)]],
      max: [
        data.max,
        [Validators.required, Validators.min(0), Validators.max(18)],
      ],
      system: [data.system, Validators.required],
      totalPoints: [data.totalPoints],
      team: teamArray,
    });

    group.get('max')?.valueChanges.subscribe((value: number | null) => {
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

    group.get('max')?.valueChanges.subscribe((value: number | null) => {
      if (value) this.adjustTeamArray(group.get('team') as FormArray, value);
    });

    group.get('ruleset')?.valueChanges.subscribe(() => {
      this.updateDetails();
    });

    this.adjustTeamArray(group.get('team') as FormArray, data.max);
    this.draftSize++;
    return group;
  }

  createTeamFormGroup(
    data: {
      name: string;
      id: string;
      value: string | null;
      tier: string;
      capt: boolean;
      drafted: boolean;
    } = {
      id: '',
      name: '',
      capt: false,
      tier: '',
      value: null,
      drafted: false,
    },
  ): FormGroup {
    const teamFormGroup = this.fb.group({
      id: [data.id, Validators.required],
      name: [data.name, Validators.required],
      capt: [data.capt, Validators.required],
      tier: [data.tier],
      value: [data.value],
      drafted: [data.drafted],
    });
    teamFormGroup.get('name')?.valueChanges.subscribe((name) => {
      if (name !== null) {
        let id = getPidByName(name);
        if (teamFormGroup.get('id')?.value != id) {
          teamFormGroup.patchValue({ id: id });
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
    return (this.plannerForm.get('drafts') as FormArray).at(
      this.selectedDraft,
    ) as FormGroup;
  }

  tabColor(tab: number) {
    return tab == this.tabSelected
      ? 'border-menu-400 bg-menu-200'
      : 'border-menu-300 hover:bg-menu-200 bg-menu-100';
  }

  minMaxStyle(i: number) {
    return i < this.getDraftFormGroup().get('min')?.value
      ? 'border-menu-500'
      : 'border-menu-300 text-menu-500';
  }

  populateTeamFromLocalStorage(formData: any): void {
    for (let i of formData.drafts) {
      const teamArray = formData.drafts[i]?.team || [];
      const teamFormArray = teamArray.get('team') as FormArray;
      teamArray.forEach((teamMember: any) => {
        const teamFormGroup = this.createTeamFormGroup();
        teamFormGroup.patchValue(teamMember);
        teamFormArray.push(teamFormGroup);
      });
    }
  }

  switchDrafts(index: number) {
    this.selectedDraft = index;
    this.updateDetails();
  }

  selectedDraftsStyle(index: number) {
    return index == this.selectedDraft
      ? 'bg-menu-100 '
      : 'bg-menu-250 hover:bg-menu-150';
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
}
