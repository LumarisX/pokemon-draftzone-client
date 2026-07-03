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
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { MatDialog } from '@angular/material/dialog';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { FormsModule } from '@angular/forms';
import { UploadService } from '@pdz/core/services/upload.service';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
} from '../../tournaments/tournament-home/coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
} from '../../tournaments/tournament-home/team-edit-dialog/team-edit-dialog.component';

type SignUpEntry = League.LeagueSignUp & {
  selected?: boolean;
  modified?: boolean;
};

@Component({
  selector: 'pdz-league-manage-signups',
  templateUrl: './league-manage-signups.component.html',
  styleUrls: ['./league-manage-signups.component.scss'],
  imports: [CommonModule, IconComponent, FormsModule, RouterLink],
})
export class LeagueManageSignupsComponent implements OnInit, OnDestroy {
  tournamentId: string | null = null;
  signUps: SignUpEntry[] = [];
  originalSignUps: League.LeagueSignUp[] = [];
  drafts: ({ name: string; draftKey: string } | undefined)[] = [];
  modified = false;

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;

  route = inject(ActivatedRoute);
  leagueService = inject(LeagueZoneService);
  uploadService = inject(UploadService);
  private dialog = inject(MatDialog);

  uploadingForId: string | null = null;
  uploadErrorById: Record<string, string> = {};
  private selectedSignup: SignUpEntry | null = null;
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
        this.drafts = [undefined, ...data.drafts];
        this.modified = false;
      },
      error: (error) => {
        console.error('Error fetching sign-ups:', error);
      },
    });
  }

  getCurrentTimeForTimezone(timezone?: string | null): string {
    if (!timezone) return 'Unknown';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeStyle: 'short',
        timeZone: timezone,
      }).format(this.currentTime);
    } catch {
      return 'Unknown';
    }
  }

  onLogoCellClick(signUp: SignUpEntry): void {
    if (!signUp.id) return;
    this.selectedSignup = signUp;
    this.uploadErrorById[signUp.id] = '';
    this.logoFileInput?.nativeElement.click();
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const signup = this.selectedSignup;
    input.value = '';
    this.selectedSignup = null;
    if (!file || !signup) return;
    this.uploadLogo(signup, file);
  }

  private uploadLogo(signup: SignUpEntry, file: File): void {
    if (!signup.id) return;

    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.uploadErrorById[signup.id] = validation.error || 'Invalid file';
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
          if (!response?.url) throw new Error('Failed to get pre-signed URL from server');
          return this.uploadService.uploadToS3(response.url, file);
        }),
        switchMap((s3Response) => {
          if (s3Response.type === HttpEventType.UploadProgress) return of(null);
          if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && uploadedFileKey) {
              return this.leagueService.updateCoachLogo(signup.id, uploadedFileKey);
            }
            throw new Error(`S3 upload failed with status: ${s3Response.status}`);
          }
          return of(null);
        }),
        catchError((error) => {
          this.uploadErrorById[signup.id] = error?.message || 'Upload failed';
          this.uploadingForId = null;
          return of(null);
        }),
        finalize(() => {
          this.uploadingForId = null;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (response) this.getSignUps();
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
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
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

  signUpInDraft(draftKey?: string): SignUpEntry[] {
    return this.signUps.filter((s) => s.draft == draftKey);
  }

  anySelected(): boolean {
    return this.signUps.some((s) => s.selected);
  }

  getTeamLink(user: League.LeagueSignUp): string[] | null {
    const leagueKey = this.leagueService.leagueKey();
    const tournamentKey = this.leagueService.tournamentKey();
    if (!leagueKey || !tournamentKey || !user.teamId) return null;
    return [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'teams',
      user.teamId,
    ];
  }

  moveToDraft(draftKey?: string): void {
    for (const signUp of this.signUps) {
      if (signUp.selected) {
        signUp.draft = draftKey;
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
          .map((s) => ({ id: s.id, draft: s.draft })),
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

  openTeamEdit(signup: SignUpEntry): void {
    const dialogRef = this.dialog.open(TeamEditDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: {
        teamName: signup.teamName,
        logoUrl: signup.logo || undefined,
      } satisfies TeamEditDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result) return;
        signup.teamName = result.teamName;
        if (result.logoFile) {
          this.uploadLogo(signup, result.logoFile);
        }
      });
  }

  openCoachEdit(signup: SignUpEntry): void {
    const dialogRef = this.dialog.open(CoachEditDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: {
        name: signup.name,
        gameName: signup.gameName,
        discordName: signup.discordName,
        timezone: signup.timezone,
      } satisfies CoachEditDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result) return;
        signup.name = result.name;
        signup.gameName = result.gameName;
        signup.discordName = result.discordName;
        signup.timezone = result.timezone;
      });
  }
}
