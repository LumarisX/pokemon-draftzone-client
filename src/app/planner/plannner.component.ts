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
import { PlannerService } from '../api/planner.service';
import {
  TypeChart,
  Summary,
  MoveChart,
} from '../matchup-overview/matchup-interface';
import { BattlePokedex } from '../pokedex';
import { PokemonId } from '../pokemon';
import { SpriteComponent } from '../images/sprite.component';
import { Planner } from './planner.interface';
import { SummaryComponent } from './summary/summary.component';
import { TypechartComponent } from './typechart/typechart.component';
import { FilterComponent } from '../filter/filter.component';
import { Pokemon } from '../interfaces/draft';
import { DataService } from '../api/data.service';
import { MoveComponent } from './moves/moves.component';
import { FinderComponent } from './finder/finder.component';

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
    SpriteComponent,
  ],
})
export class PlannerComponent implements OnInit {
  plannerForm!: FormGroup;
  team: PokemonId[] = [];
  typechart!: TypeChart;
  summary!: Summary;
  tabSelected = 1;
  formats = [];
  rulesets = [];
  movechart: MoveChart = [];

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = <any>formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = <any>rulesets;
    });

    this.plannerForm = this.fb.group({
      format: ['', Validators.required],
      ruleset: ['', Validators.required],
      min: [11, [Validators.required, Validators.min(0)]], //set to 10
      max: [11, [Validators.required, Validators.min(0), Validators.max(18)]], //set to 12
      system: ['points', Validators.required],
      totalPoints: [160], // set to 0
      team: this.fb.array([]),
    });

    this.plannerForm.get('max')?.valueChanges.subscribe((value: number) => {
      this.plannerForm
        .get('min')
        ?.setValidators([
          Validators.required,
          Validators.min(0),
          this.maxValidator(value),
        ]);
      this.plannerForm.get('min')?.updateValueAndValidity();
    });
    this.plannerForm.get('max')?.valueChanges.subscribe((value: number) => {
      this.adjustTeamArray(value);
    });

    this.adjustTeamArray(12);

    const formData = sessionStorage.getItem('plannerFormData');
    if (formData) {
      this.plannerForm.patchValue(JSON.parse(formData));
      this.updateDetails();
    }
    this.plannerForm.valueChanges.subscribe((value) => {
      sessionStorage.setItem('plannerFormData', JSON.stringify(value));
    });
  }

  get isPoints() {
    return this.plannerForm.get('system')?.value === 'points';
  }

  get remainingPoints() {
    let total: number = 0;
    for (let control of this.teamFormArray?.controls) {
      total += control.get('value')?.value;
    }
    return this.plannerForm.get('totalPoints')?.value - total;
  }

  get tieredCount() {
    let total: number = 0;
    for (let control of this.teamFormArray?.controls) {
      if (control.get('pid')?.value != '') {
        total++;
      }
    }
    return total;
  }

  get remainingPokemon() {
    let mons = this.plannerForm.get('min')?.value - this.tieredCount;
    if (mons > 1) {
      return mons;
    }
    return 1;
  }

  updateDetails() {
    let newteam: PokemonId[] = [];
    for (let pokemon of this.teamFormArray.controls) {
      let pid = pokemon.get('pid')?.value;
      if (pid in BattlePokedex) {
        newteam.push(pid);
      }
    }
    if (newteam.toString() != this.team.toString()) {
      this.team = newteam;
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
    this.updateDetails();
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

  adjustTeamArray(newSize: number): void {
    const currentSize = this.teamFormArray.length;
    if (newSize > currentSize) {
      for (let i = currentSize; i < newSize; i++) {
        this.teamFormArray.push(this.createTeamFormGroup());
      }
    } else if (newSize < currentSize) {
      for (let i = currentSize; i > newSize; i--) {
        this.teamFormArray.removeAt(i - 1);
        this.updateDetails();
      }
    }
  }

  get teamFormArray(): FormArray {
    return this.plannerForm.get('team') as FormArray;
  }

  createTeamFormGroup(): FormGroup {
    return this.fb.group({
      pid: ['', Validators.required],
      name: ['', Validators.required],
      capt: [false, Validators.required],
      tier: [''],
      value: [0],
    });
  }
}
