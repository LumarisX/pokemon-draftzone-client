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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';

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
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  styleUrl: './sign-up.component.scss',
})
export class BZSignUpComponent implements OnInit {
  signupForm!: FormGroup;
  formats: string[] = [];
  rulesets: string[] = [];

  timezones = Intl.supportedValuesOf('timeZone');

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
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

  onSubmit() {}
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
