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
import { LeagueAdsService } from '../../api/league-ads.service';
import { DataService } from '../../api/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'bz-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
    private dataService: DataService,
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

  onSubmit() {
    if (this.signupForm.valid) {
      this.leagueService.newAd(this.signupForm.value).subscribe(() => {
        this.router.navigate(['/league-list/manage']);
      });
    }
  }
}
