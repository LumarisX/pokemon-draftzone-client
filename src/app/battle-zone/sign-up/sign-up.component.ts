import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatError,
  MatFormField,
  MatInput,
  MatLabel,
} from '@angular/material/input';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bz-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    ReactiveFormsModule,
    RouterModule,
  ],
  styles: `
    textarea {
      resize: none;
    }
  `,
})
export class BZSignUpComponent implements OnInit {
  signupForm!: FormGroup;
  formats: string[] = [];
  rulesets: string[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      discordName: ['', Validators.required],
      timezone: ['', Validators.required],
      experience: [''],
      confirm: [false, Validators.required],
    });
  }

  onSubmit() {}
}
