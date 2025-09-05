import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
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
import { map, Subject, take, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../services/league-zone.service';
import { AuthService } from '../../services/auth0.service';
import { TierPokemon } from '../league-tier-list/league-tier-old';

export type LeagueTier = {
  name: string;
  pokemon: TierPokemon[];
};

export type LeagueTierGroup = {
  label?: string;
  tiers: LeagueTier[];
};

@Component({
  selector: 'pdz-league-sign-up',
  templateUrl: './league-sign-up.component.html',
  styleUrl: './league-sign-up.component.scss',
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
})
export class LeagueSignUpComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private leagueService = inject(LeagueZoneService);
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();

  signupForm!: FormGroup;
  added = false;
  closed = false;
  timezones = Intl.supportedValuesOf('timeZone');
  signUpDeadline: Date = new Date('2026-09-21T12:00:00');
  signUpItem: string = 'pdbls2';

  details: {
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
  } = {
    format: 'Singles',
    ruleset: 'Gen9 NatDex',
    draft: [new Date('2025-09-22T12:00:00'), new Date('2025-09-27T12:00:00')],
    season: [new Date('2025-09-29T12:00:00'), new Date('2025-11-23T12:00:00')],
  };

  ngOnInit(): void {
    this.closed = new Date() > this.signUpDeadline;
    // this.added = localStorage.getItem(this.signUpItem) !== null;
    this.createForm().subscribe((form) => {
      this.signupForm = form;
      this.manageFormLogic();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm() {
    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        const discordName = user?.sub?.startsWith('oauth2|discord')
          ? user.username
          : '';

        return this.fb.group({
          discordName: [discordName, Validators.required],
          timezone: [
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            Validators.required,
          ],
          experience: [''],
          droppedBefore: [null, Validators.required],
          droppedWhy: [''],
          confirm: [false, Validators.requiredTrue],
        });
      }),
    );
  }

  private manageFormLogic(): void {
    this.signupForm
      .get('droppedBefore')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((dropped) => {
        const droppedWhyControl = this.signupForm.get('droppedWhy');
        if (dropped) {
          droppedWhyControl?.addValidators(Validators.required);
        } else {
          droppedWhyControl?.clearValidators();
        }
        droppedWhyControl?.updateValueAndValidity();
      });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.leagueService.signUp(this.signupForm.value).subscribe((response) => {
        this.added = true;
        localStorage.setItem(
          this.signUpItem,
          this.signupForm.get('discordName')?.value ?? '',
        );
      });
    } else {
      console.error('Sign Up form is not valid: ', this.signupForm.errors);
    }
  }
}
