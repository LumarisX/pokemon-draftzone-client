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
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  catchError,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from '../../services/auth0.service';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { UploadService } from '../../services/upload.service';
import { LoadingComponent } from '../../images/loading/loading.component';
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
  private leagueService = inject(LeagueZoneService);
  private uploadService = inject(UploadService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  signupForm!: FormGroup;
  added = false;
  closed = false;
  timezones = Intl.supportedValuesOf('timeZone');
  signUpDeadline?: Date;
  logoFile: File | null = null;
  logoFileName: string = '';
  isUploading = false;
  uploadError: string | null = null;
  relatedEntityId: string | null = null;
  tournamentId: string | null = null;

  leagueInfo: League.LeagueInfo | null = null;

  ngOnInit(): void {
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

  onSubmit() {
    const tournamentKey = this.leagueService.tournamentKey();
    if (this.signupForm.valid && tournamentKey) {
      this.leagueService.signUp(this.signupForm.value).subscribe({
        next: (response: any) => {
          this.added = true;
          this.relatedEntityId = response.userId;
          this.tournamentId = response.tournamentId;
          localStorage.setItem(
            tournamentKey,
            this.signupForm.get('discordName')?.value ?? '',
          );

          if (this.logoFile) {
            this.uploadLogo();
          }
        },
        error: (error) => {
          console.error('Sign up failed:', error);
        },
      });
    } else {
      console.error('Sign Up form is not valid: ', this.signupForm.errors);
    }
  }

  private uploadLogo(): void {
    if (!this.logoFile) {
      console.warn('uploadLogo called but no file selected');
      return;
    }

    if (!this.relatedEntityId) {
      this.uploadError = 'Cannot upload logo: User ID not available';
      console.error('uploadLogo called but relatedEntityId is null');
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    const file = this.logoFile;
    let uploadedFileKey: string | null = null;

    console.log(`Starting logo upload for user: ${this.relatedEntityId}`);

    this.leagueService
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        tap((response) => {
          console.log('Received presigned URL response:', {
            hasUrl: !!response.url,
            key: response.key,
          });
          uploadedFileKey = response.key;
        }),
        switchMap((response) => {
          if (!response || !response.url) {
            throw new Error('Failed to get pre-signed URL from server');
          }
          console.log('Uploading to S3...');
          return this.uploadService.uploadToS3(response.url, file);
        }),
        switchMap((s3Response) => {
          if (s3Response.type === HttpEventType.UploadProgress) {
            return of(null);
          } else if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && uploadedFileKey) {
              console.log('S3 upload successful, confirming with backend...');
              return of(uploadedFileKey);
            } else {
              throw new Error(
                `S3 upload failed with status: ${s3Response.status}`,
              );
            }
          }
          return of(null);
        }),
        switchMap((fileKey) => {
          if (!fileKey) return of(null);

          return this.leagueService.confirmUploadWithRelatedEntity(
            fileKey,
            file.size,
            file.type || 'image/png',
            this.relatedEntityId!,
            this.tournamentId!,
          );
        }),
        catchError((error) => {
          this.uploadError = error?.message || 'Upload failed';
          console.error('Logo upload error:', error);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isUploading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('Logo uploaded and confirmed successfully:', response);
          }
        },
        error: (error) => {
          console.error('Upload process failed:', error);
          this.uploadError =
            error?.message || 'Upload failed. Please try again.';
        },
      });
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
