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
import { FilterComponent } from '../filter/filter.component';
import { SpriteComponent } from '../images/sprite.component';
import { Pokemon } from '../interfaces/draft';
import {
  MoveChart,
  Summary,
  TypeChart,
} from '../matchup-overview/matchup-interface';
import { Pokedex } from '../pokedex';
import { PokemonId, getPidByName } from '../pokemon';
import { FinderComponent } from './finder/finder.component';
import { MoveComponent } from './moves/moves.component';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { TrashSVG } from '../images/svg-components/trash.component';
import { GearSVG } from '../images/svg-components/gear.component';

type Planner = {
  summary: Summary;
  typechart: TypeChart;
  movechart: MoveChart;
};

@Component({
  selector: 'planner',
  standalone: true,
  templateUrl: './planner.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FilterComponent,
    TypechartComponent,
    SummaryComponent,
    MoveComponent,
    FinderComponent,
    ReactiveFormsModule,
    FormsModule,
    PlusSVG,
    TrashSVG,
    GearSVG,
    SpriteComponent,
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
  team: PokemonId[] = [];
  summary: Summary = {
    team: [],
    teamName: '',
    stats: { mean: {}, median: {}, max: {} },
  };
  tabSelected = 0;
  selectedDraft = 0;
  formats = [];
  rulesets = [];
  movechart: MoveChart = [];
  draftSize = 0;
  settings = true;

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    // Populate form data from localStorage if available
    const storedPlannerData = localStorage.getItem('plannerData');
    if (storedPlannerData) {
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
                pid: string;
                value: string;
                tier: string;
                capt: boolean;
              }[];
            }) => this.createDraftFormGroup(value)
          )
        ),
      });
    } else {
      this.plannerForm = this.fb.group({
        drafts: this.fb.array([this.createDraftFormGroup()]),
      });
    }

    this.updateDetails();

    // Listen for form changes and save to localStorage
    this.draftArray.valueChanges.subscribe((value) => {
      localStorage.setItem('plannerData', JSON.stringify(value));
    });

    // Initialize formats and rulesets
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = <any>formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = <any>rulesets;
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
      let value = control.get('pid')?.value;
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
      let pid = pokemon.get('pid')?.value;
      if (pid in Pokedex) {
        this.team.push(pid);
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
    } else {
      this.plannerService.getPlannerDetails(this.team).subscribe((data) => {
        let planner = <Planner>data;
        this.typechart = planner.typechart;
        this.summary = planner.summary;
        this.movechart = planner.movechart;
      });
    }
  }

  resultSelected(formGroup: AbstractControl, $event: Pokemon) {
    formGroup.patchValue({ name: $event.name, pid: $event.pid });
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
        pid: string;
        value: string;
        tier: string;
        capt: boolean;
      }[];
    } = {
      format: '',
      ruleset: '',
      draftName: 'Draft ' + (this.draftSize + 1),
      min: 10,
      max: 12,
      system: 'points',
      totalPoints: 100,
      team: [],
    }
  ): FormGroup {
    let teamArray = this.fb.array(
      data.team.map((mon) => this.createTeamFormGroup(mon))
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

    this.adjustTeamArray(group.get('team') as FormArray, data.max);
    this.draftSize++;
    return group;
  }

  createTeamFormGroup(
    data: {
      name: string;
      pid: string;
      value: string | null;
      tier: string;
      capt: boolean;
    } = { pid: '', name: '', capt: false, tier: '', value: null }
  ): FormGroup {
    const teamFormGroup = this.fb.group({
      pid: [data.pid, Validators.required],
      name: [data.name, Validators.required],
      capt: [data.capt, Validators.required],
      tier: [data.tier],
      value: [data.value],
    });
    teamFormGroup.get('name')?.valueChanges.subscribe((name) => {
      if (name !== null) {
        let pid = getPidByName(name);
        if (teamFormGroup.get('pid')?.value != pid) {
          teamFormGroup.patchValue({ pid: pid });
        }
      }
    });

    teamFormGroup.get('pid')?.valueChanges.subscribe((pid) => {
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
      this.selectedDraft
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
}
