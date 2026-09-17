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
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { FormsModule } from '@angular/forms';
import { UploadService } from '@pdz/core/services/upload.service';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
  CoachEditDialogResult,
} from '../../dialogs/coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
  TeamEditDialogResult,
} from '../../dialogs/team-edit-dialog/team-edit-dialog.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';

type SignUpEntry = League.LeagueSignUp & {
  selected?: boolean;
  modified?: boolean;
};

@Component({
  selector: 'pdz-league-manage-signups',
  templateUrl: './league-manage-signups.component.html',
  styleUrls: ['./league-manage-signups.component.scss'],
  imports: [
    CommonModule,
    IconComponent,
    FormsModule,
    RouterLink,
    SelectComponent,
    SelectOptionComponent,
    ChoiceDirective,
    ButtonComponent,
    DisclosureComponent,
    PageHeaderComponent,
  ],
})
export class LeagueManageSignupsComponent implements OnInit, OnDestroy {
  tournamentSlug: string | null = null;
  signUps: SignUpEntry[] = [];
  originalSignUps: League.LeagueSignUp[] = [];
  drafts: ({ name: string; draftSlug: string } | undefined)[] = [];
  modified = false;
  deniedCollapsed = true;
  droppedCollapsed = true;

  readonly statusOptions: {
    value: League.SignUpStatus;
    label: string;
  }[] = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'denied', label: 'Denied' },
    { value: 'dropped', label: 'Dropped' },
  ];

  private readonly statusOrder: Record<League.SignUpStatus, number> = {
    approved: 0,
    pending: 1,
    dropped: 2,
    denied: 3,
  };

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;

  route = inject(ActivatedRoute);
  leagueService = inject(LeagueZoneService);
  uploadService = inject(UploadService);
  private dialogs = inject(DialogService);
  private toast = inject(ToastService);

  uploadingForId: string | null = null;
  removingId: string | null = null;
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
          if (!response?.url)
            throw new Error('Failed to get pre-signed URL from server');
          return this.uploadService.uploadToS3(response.url, file);
        }),
        switchMap((s3Response) => {
          if (s3Response.type === HttpEventType.UploadProgress) return of(null);
          if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && uploadedFileKey) {
              return this.leagueService.updateCoachLogo(
                signup.id,
                uploadedFileKey,
              );
            }
            throw new Error(
              `S3 upload failed with status: ${s3Response.status}`,
            );
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

  signUpInDraft(draftSlug?: string): SignUpEntry[] {
    return this.signUps
      .filter(
        (s) =>
          s.draft == draftSlug &&
          s.status !== 'denied' &&
          s.status !== 'dropped',
      )
      .sort(
        (a, b) =>
          (this.statusOrder[a.status] ?? 1) - (this.statusOrder[b.status] ?? 1),
      );
  }

  deniedSignUps(): SignUpEntry[] {
    return this.signUps.filter((s) => s.status === 'denied');
  }

  droppedSignUps(): SignUpEntry[] {
    return this.signUps.filter((s) => s.status === 'dropped');
  }

  async removeParticipant(signUp: SignUpEntry): Promise<void> {
    const confirmed = await this.dialogs.confirm(
      `Remove ${signUp.teamName}?`,
      {
        message:
          'This deletes the coach and their team for good. Teams that have already played a match cannot be removed — leave those dropped instead.',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        confirmColor: 'danger',
      },
    );
    if (!confirmed) return;

    this.removingId = signUp.id;
    this.leagueService
      .removeParticipant(signUp.id)
      .pipe(
        finalize(() => (this.removingId = null)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.signUps = this.signUps.filter((s) => s.id !== signUp.id);
          this.toast.success(`${signUp.teamName} removed.`);
        },
        error: (error) => {
          this.toast.error(
            error?.error?.message ?? 'Could not remove that participant.',
          );
        },
      });
  }

  setStatus(signUp: SignUpEntry, status: League.SignUpStatus): void {
    if (signUp.status === status) return;
    signUp.status = status;
    signUp.modified = true;
    this.modified = true;
  }

  anySelected(): boolean {
    return this.signUps.some((s) => s.selected);
  }

  getTeamLink(user: League.LeagueSignUp): string[] | null {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    if (!leagueSlug || !tournamentSlug || !user.teamSlug) return null;
    return [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'teams',
      user.teamSlug,
    ];
  }

  moveToDraft(draftSlug?: string): void {
    for (const signUp of this.signUps) {
      if (signUp.selected) {
        signUp.draft = draftSlug;
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
          .map((s) => ({ id: s.id, draft: s.draft, status: s.status })),
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

  async openTeamEdit(signup: SignUpEntry): Promise<void> {
    const result = await this.dialogs.open<
      TeamEditDialogComponent,
      TeamEditDialogResult,
      TeamEditDialogData
    >(TeamEditDialogComponent, {
      heading: 'Edit Team Info',
      data: {
        teamName: signup.teamName,
        logoUrl: signup.logo || undefined,
      },
    }).closed;

    if (!result) return;
    signup.teamName = result.teamName;
    if (result.logoFile) {
      this.uploadLogo(signup, result.logoFile);
    }
  }

  async openCoachEdit(signup: SignUpEntry): Promise<void> {
    const result = await this.dialogs.open<
      CoachEditDialogComponent,
      CoachEditDialogResult,
      CoachEditDialogData
    >(CoachEditDialogComponent, {
      heading: 'Edit Coach Info',
      data: {
        name: signup.name,
        gameName: signup.gameName,
        discordName: signup.discordName,
        timezone: signup.timezone,
      },
    }).closed;

    if (!result) return;
    signup.name = result.name;
    signup.gameName = result.gameName;
    signup.discordName = result.discordName;
    signup.timezone = result.timezone;
  }
}
