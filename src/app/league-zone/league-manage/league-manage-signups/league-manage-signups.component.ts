import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Subject,
  catchError,
  finalize,
  interval,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { IconComponent } from '../../../images/icon/icon.component';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { UploadService } from '../../../services/upload.service';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pdz-league-manage-signups',
  templateUrl: './league-manage-signups.component.html',
  styleUrls: ['./league-manage-signups.component.scss'],
  imports: [CommonModule, IconComponent, FormsModule],
})
export class LeagueManageSignupsComponent implements OnInit, OnDestroy {
  tournamentId: string | null = null;
  signUps: (League.LeagueSignUp & {
    selected?: boolean;
    modified?: boolean;
  })[] = [];
  originalSignUps: League.LeagueSignUp[] = [];
  divisions: ({ name: string; divisionKey: string } | undefined)[] = [];
  modified = false;

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;

  route = inject(ActivatedRoute);
  leagueService = inject(LeagueZoneService);
  uploadService = inject(UploadService);

  uploadingForId: string | null = null;
  uploadErrorById: Record<string, string> = {};
  private selectedSignup: League.LeagueSignUp | null = null;
  private destroy$ = new Subject<void>();
  currentTime = new Date();

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  ngOnInit(): void {
    this.getSignUps();
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSignUps(): void {
    this.leagueService.getSignUps().subscribe({
      next: (data) => {
        this.signUps = data.signups;
        this.originalSignUps = JSON.parse(JSON.stringify(data.signups));
        this.divisions = [undefined, ...data.divisions];
        this.modified = false;
      },
      error: (error) => {
        console.error('Error fetching sign-ups:', error);
      },
    });
  }

  getLogoUrl = getLogoUrl('league-uploads');

  getCurrentTimeForTimezone(timezone?: string | null): string {
    if (!timezone) {
      return 'Unknown';
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        timeStyle: 'short',
        timeZone: timezone,
      }).format(this.currentTime);
    } catch {
      return 'Unknown';
    }
  }

  onLogoCellClick(signUp: League.LeagueSignUp): void {
    if (!signUp.id) {
      console.warn('Cannot upload logo: signup id missing');
      return;
    }

    this.selectedSignup = signUp;
    this.uploadErrorById[signUp.id] = '';
    this.logoFileInput?.nativeElement.click();
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const signup = this.selectedSignup;

    if (!file || !signup || !signup.id) {
      input.value = '';
      return;
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.uploadErrorById[signup.id] = validation.error || 'Invalid file';
      input.value = '';
      return;
    }

    this.uploadingForId = signup.id;
    this.uploadErrorById[signup.id] = '';

    let uploadedFileKey: string | null = null;

    this.leagueService
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        tap((response) => {
          uploadedFileKey = response.key;
        }),
        switchMap((response) => {
          if (!response?.url) {
            throw new Error('Failed to get pre-signed URL from server');
          }
          return this.uploadService.uploadToS3(response.url, file);
        }),
        switchMap((s3Response) => {
          if (s3Response.type === HttpEventType.UploadProgress) {
            return of(null);
          }
          if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && uploadedFileKey) {
              return this.leagueService
                .confirmUpload(
                  uploadedFileKey,
                  file.size,
                  file.type || 'image/png',
                )
                .pipe(
                  switchMap(() =>
                    this.leagueService.updateCoachLogo(
                      signup.id,
                      uploadedFileKey!,
                    ),
                  ),
                );
            }
            throw new Error(
              `S3 upload failed with status: ${s3Response.status}`,
            );
          }
          return of(null);
        }),
        catchError((error) => {
          const message = error?.message || 'Upload failed';
          this.uploadErrorById[signup.id] = message;
          this.uploadingForId = null;
          this.selectedSignup = null;
          return of(null);
        }),
        finalize(() => {
          this.uploadingForId = null;
          input.value = '';
          this.selectedSignup = null;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.uploadingForId = null;
            this.selectedSignup = null;
            this.getSignUps();
          }
        },
        error: () => {
          this.uploadingForId = null;
          this.selectedSignup = null;
        },
      });
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.ALLOWED_TYPES.join(', ')}`,
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }

    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      return { valid: false, error: 'Invalid file name' };
    }

    return { valid: true };
  }

  signUpInDivision(divisionKey?: string) {
    return this.signUps.filter((s) => s.division == divisionKey);
  }

  moveToDivision(divisionKey?: string) {
    for (const signUp of this.signUps) {
      if (signUp.selected) {
        signUp.division = divisionKey;
        signUp.selected = false;
        signUp.modified = true;
      }
    }
    this.modified = true;
  }

  saveChanges(): void {
    this.leagueService
      .updateSignUps(
        this.signUps
          .filter((s) => s.modified)
          .map((s) => ({ id: s.id, division: s.division })),
      )
      .subscribe({
        next: () => {
          this.originalSignUps = JSON.parse(JSON.stringify(this.signUps));
          this.modified = false;
        },
        error: (error) => {
          console.error('Error saving sign-ups:', error);
        },
      });
  }

  revertChanges(): void {
    this.signUps = JSON.parse(JSON.stringify(this.originalSignUps));
    this.modified = false;
  }
}
