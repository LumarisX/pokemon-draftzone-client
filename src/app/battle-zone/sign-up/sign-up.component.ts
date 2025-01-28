import { CommonModule, DatePipe } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { BattleZoneService } from '../../api/battle-zone.service';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

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
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [DatePipe],
  styleUrl: './sign-up.component.scss',
})
export class BZSignUpComponent implements OnInit {
  signupForm!: FormGroup;
  added = false;
  timezones = Intl.supportedValuesOf('timeZone');

  details?: {
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
    prize: number;
  };
  constructor(
    private fb: FormBuilder,
    private battlezoneService: BattleZoneService,
  ) {}

  ngOnInit(): void {
    this.battlezoneService.getDetails().subscribe((response) => {
      this.details = response;
    });
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
          if (response.status === 201) {
            this.added = true;
          }
          console.log(response);
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
