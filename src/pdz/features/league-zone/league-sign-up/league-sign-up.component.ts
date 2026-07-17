import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  catchError,
  filter,
  firstValueFrom,
  map,
  of,
  Subject,
  take,
  takeUntil,
} from 'rxjs';

import { UploadService } from '@pdz/core/services/upload.service';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLogoUrlOld } from '../league.util';

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
  leagueService = inject(LeagueZoneService);
  private router = inject(Router);
  private uploadService = inject(UploadService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  @Input() embedded = false;

  signupForm!: FormGroup;
  added = false;
  closed = false;
  wantsToSignUpAsSub = false;
  timezones = Intl.supportedValuesOf('timeZone');
  signUpDeadline?: Date;
  logoFile: File | null = null;
  logoFileName: string = '';
  isUploading = false;
  isSubmitting = false;
  uploadError: string | null = null;

  leagueInfo: League.LeagueInfo | null = null;
  isCheckingSignUp = true;

  ngOnInit(): void {
    this.leagueService
      .getCoachData({ suppressStatuses: [404] })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((coachData) => {
        if (coachData) {
          this.navigateToTournamentHome();
        } else {
          this.isCheckingSignUp = false;
        }
      });

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leagueInfo) => {
          this.leagueInfo = leagueInfo;
          this.updateClosedStatus();
        },
        error: (error) => {
          console.error('Error fetching league info:', error);
        },
      });

    this.createForm().subscribe((form) => {
      this.signupForm = form;
      this.manageFormLogic();
    });
  }

  private updateClosedStatus(): void {
    if (this.leagueInfo?.signUpDeadline) {
      const now = new Date();
      const deadline = new Date(this.leagueInfo.signUpDeadline);
      this.closed = now > deadline;
    }
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
          name: ['', Validators.required],
          gameName: ['', Validators.required],
          discordName: [discordName, Validators.required],
          timezone: [
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            Validators.required,
          ],
          teamName: ['', Validators.required],
          experience: ['', Validators.required],
          droppedBefore: [null, Validators.required],
          droppedWhy: ['', Validators.required],
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

  async onSubmit() {
    if (this.isSubmitting) return;

    const tournamentKey = this.leagueService.tournamentKey();
    if (!this.signupForm.valid || !tournamentKey) {
      console.error('Sign Up form is not valid: ', this.signupForm.errors);
      return;
    }

    try {
      this.isSubmitting = true;
      this.uploadError = null;
      let logoFileKey: string | undefined;

      if (this.logoFile) {
        this.isUploading = true;
        logoFileKey = await this.uploadLogoAndGetFileKey(this.logoFile);
      }

      const signupPayload = logoFileKey
        ? { ...this.signupForm.value, logo: logoFileKey }
        : this.signupForm.value;

      const response: any = await firstValueFrom(
        this.leagueService
          .signUp(signupPayload)
          .pipe(takeUntil(this.destroy$), take(1)),
      );

      this.added = true;
      localStorage.setItem(
        tournamentKey,
        this.signupForm.get('discordName')?.value ?? '',
      );
      console.log('Sign up successful:', response);
      this.navigateToTournamentHome();
    } catch (error: any) {
      console.error('Sign up failed:', error);
      if (this.logoFile && !this.uploadError) {
        this.uploadError = error?.message || 'Upload failed. Please try again.';
      }
    } finally {
      this.isUploading = false;
      this.isSubmitting = false;
    }
  }

  private navigateToTournamentHome(): void {
    const leagueKey = this.leagueService.leagueKey();
    const tournamentKey = this.leagueService.tournamentKey();
    this.router.navigate([
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
    ]);
  }

  confirmSignUpAsSub(): void {
    this.wantsToSignUpAsSub = true;
  }

  cancelSignUp(): void {
    this.wantsToSignUpAsSub = false;
  }

  private async uploadLogoAndGetFileKey(originalFile: File): Promise<string> {
    this.uploadError = null;

    const buffer = await originalFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const ext = originalFile.name.includes('.')
      ? originalFile.name.substring(originalFile.name.lastIndexOf('.'))
      : '';
    const file = new File([originalFile], `${hashHex}${ext}`, {
      type: originalFile.type,
    });

    const presigned = await firstValueFrom(
      this.leagueService
        .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
        .pipe(takeUntil(this.destroy$), take(1)),
    );

    await firstValueFrom(
      this.uploadService.uploadToS3(presigned.url, file).pipe(
        filter((response) => response instanceof HttpResponse),
        map((response) => response as HttpResponse<object>),
        take(1),
        map((response) => {
          if (!response.ok) {
            throw new Error(`S3 upload failed with status: ${response.status}`);
          }
          return response;
        }),
        takeUntil(this.destroy$),
      ),
    );

    return presigned.key;
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logoFile = input.files[0];
      this.logoFileName = this.logoFile.name;
    } else {
      this.logoFile = null;
      this.logoFileName = '';
    }
  }

  getLogoUrl = getLogoUrlOld('league-uploads');
}
