import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { map, Subject, take, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth0.service';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';

@Component({
  selector: 'pdz-league-sign-up',
  templateUrl: './league-sign-up.component.html',
  styleUrls: ['./league-sign-up.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingComponent,
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
  signUpDeadline?: Date;
  logoFile: File | null = null;
  logoFileName: string = '';

  leagueInfo: League.LeagueInfo | null = null;

  ngOnInit(): void {
    // Fetch league info from API
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leagueInfo) => {
          this.leagueInfo = leagueInfo;
        },
        error: (error) => {
          console.error('Error fetching league info:', error);
        },
      });

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
          teamName: ['', Validators.required],
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
    const leagueKey = this.leagueService.leagueKey();
    if (this.signupForm.valid && leagueKey) {
      this.leagueService.signUp(this.signupForm.value).subscribe((response) => {
        this.added = true;
        localStorage.setItem(
          leagueKey,
          this.signupForm.get('discordName')?.value ?? '',
        );
      });
    } else {
      console.error('Sign Up form is not valid: ', this.signupForm.errors);
    }
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logoFile = input.files[0];
      this.logoFileName = this.logoFile.name;
      // TODO: Add logic to upload the logo file or include it in the form submission
      console.log('Logo file selected:', this.logoFile.name);
    } else {
      this.logoFile = null;
      this.logoFileName = '';
    }
  }

  getLogoUrl = getLogoUrl('league-uploads');
}
