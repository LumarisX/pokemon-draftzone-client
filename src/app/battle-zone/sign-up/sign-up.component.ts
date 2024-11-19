import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LeagueAdsService } from '../../api/league-ads.service';

@Component({
  selector: 'bz-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  styles: `textarea {
    resize: none
  }`,
})
export class BZSignUpComponent implements OnInit {
  signupForm!: FormGroup;
  formats: string[] = [];
  rulesets: string[] = [];

  constructor(
    private fb: FormBuilder,
    private leagueService: LeagueAdsService,
    private router: Router
  ) {}

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
