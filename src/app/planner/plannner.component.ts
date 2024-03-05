import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlannerService } from '../api/planner.service';
import { TypeChart, summary } from '../matchup-overview/matchup-interface';
import { SpriteComponent } from '../sprite/sprite.component';
import { Planner } from './planner.interface';
import { TypechartComponent } from './typechart/typechart.component';
import { SummaryComponent } from './summary/summary.component';
import { PokemonId } from '../pokemon';

@Component({
  selector: 'planner',
  standalone: true,
  templateUrl: './planner.component.html',
  imports: [
    CommonModule,
    RouterModule,
    TypechartComponent,
    SummaryComponent,
    ReactiveFormsModule,
    FormsModule,
    SpriteComponent,
  ],
})
export class PlannerComponent implements OnInit {
  myForm!: FormGroup;
  typechart!: TypeChart;
  summary!: summary;

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService
  ) {}

  ngOnInit(): void {
    this.myForm = this.fb.group({
      format: ['', Validators.required],
      ruleset: ['', Validators.required],
      min: [0, [Validators.required, Validators.min(0)]],
      max: [0, [Validators.required, Validators.min(0), Validators.max(18)]],
      tier: ['', Validators.required],
      totalPoints: [''],
      team: this.fb.array([]),
    });

    this.myForm.get('max')?.valueChanges.subscribe((value: number) => {
      this.myForm
        .get('min')
        ?.setValidators([
          Validators.required,
          Validators.min(0),
          this.maxValidator(value),
        ]);
      this.myForm.get('min')?.updateValueAndValidity();
    });
    this.myForm.get('max')?.valueChanges.subscribe((value: number) => {
      this.adjustTeamArray(value);
    });
  }

  updateDetails() {
    const team = this.teamFormArray.controls.map(
      (control) => control.get('pid')?.value
    );
    this.plannerService.getPlannerDetails(team).subscribe((data) => {
      let planner = <Planner>data;
      this.typechart = planner.typechart;
      this.summary = planner.summary;
    });
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
      }
    }
  }

  get teamFormArray(): FormArray {
    return this.myForm.get('team') as FormArray;
  }

  createTeamFormGroup(): FormGroup {
    return this.fb.group({
      pid: ['', Validators.required],
      capt: ['', Validators.required],
      tier: [''],
    });
  }
}
