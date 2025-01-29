import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { BattleZoneService } from '../../api/battle-zone.service';

@Component({
  selector: 'bz-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  styleUrl: './sign-up.component.scss',
})
export class BZSignUpComponent implements OnInit {
  signupForm!: FormGroup;
  added = false;
  timezones = Intl.supportedValuesOf('timeZone');

  details: {
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
  } = {
    format: 'Singles',
    ruleset: 'Gen9 NatDex',
    draft: [new Date('2025-02-18T12:00:00'), new Date('2025-02-22T12:00:00')],
    season: [new Date('2025-02-23T12:00:00'), new Date('2025-04-20T12:00:00')],
  };
  constructor(
    private fb: FormBuilder,
    private battlezoneService: BattleZoneService,
  ) {}

  ngOnInit(): void {
    this.added = localStorage.getItem('pdbls1') !== null;

    this.resetForm();
  }

  resetForm() {
    this.signupForm = this.fb.group(
      {
        discordName: ['', Validators.required],
        timezone: [
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          Validators.required,
        ],
        experience: [''],
        droppedBefore: [null, Validators.required],
        droppedWhy: [''],
        confirm: [false, Validators.requiredTrue],
      },
      { validators: [droppedValidator()] },
    );
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.battlezoneService
        .signUp(this.signupForm.value)
        .subscribe((response) => {
          this.added = true;
          localStorage.setItem(
            'pdbls1',
            this.signupForm.get('discordName')?.value ?? '',
          );
        });
    } else {
      console.error('Sign Up form is not valid: ', this.signupForm.errors);
    }
  }
}

function droppedValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const droppedBefore = group.get('droppedBefore');
    const droppedWhy = group.get('droppedWhy');
    if (
      droppedBefore?.value === true &&
      (!droppedWhy || droppedWhy?.value.trim() === '')
    ) {
      droppedWhy?.setErrors({ required: true });
      return { droppedWhyRequired: true };
    }
    return null;
  };
}
