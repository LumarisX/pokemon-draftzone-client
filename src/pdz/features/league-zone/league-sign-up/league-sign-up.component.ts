import { DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { UploadService } from '@pdz/core/services/upload.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  SIGN_UP_LIMITS,
  getLeagueLogoUrl,
} from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import {
  FieldErrorDirective,
  FieldHintDirective,
} from '@pdz/shared/inputs/field/field-message.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, filter, firstValueFrom, map, of, take } from 'rxjs';

type AnswerValue = string | string[];

@Component({
  selector: 'pdz-league-sign-up',
  templateUrl: './league-sign-up.component.html',
  styleUrl: './league-sign-up.component.scss',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    InputDirective,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
    TeamLogoComponent,
  ],
})
export class LeagueSignUpComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly router = inject(Router);
  private readonly uploadService = inject(UploadService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly limits = SIGN_UP_LIMITS;
  protected readonly timezones = Intl.supportedValuesOf('timeZone');
  private readonly invite =
    new URLSearchParams(window.location.search).get('invite') ?? undefined;

  readonly signupForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    gameName: ['', Validators.required],
    discordName: ['', Validators.required],
    timezone: [
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      Validators.required,
    ],
    teamName: ['', Validators.required],
    confirm: [false, Validators.requiredTrue],
    answers: this.fb.group({}),
  });

  readonly leagueInfo = signal<League.LeagueInfo | null>(null);
  readonly isCheckingSignUp = signal(true);
  readonly wantsToSignUpAsSub = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly logoFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);

  readonly closed = computed(() => {
    const deadline = this.leagueInfo()?.signUpDeadline;
    return !!deadline && Date.now() > new Date(deadline).getTime();
  });

  readonly logoUrl = computed(() => getLeagueLogoUrl(this.leagueInfo()?.logo));

  readonly rulesLink = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueService.leagueSlug(),
    'tournaments',
    this.leagueInfo()?.tournamentSlug ?? this.leagueService.tournamentSlug(),
    'rules',
  ]);

  private get answerGroup(): FormGroup {
    return this.signupForm.controls.answers;
  }

  private get questions(): League.SignUpQuestion[] {
    return this.leagueInfo()?.signUpQuestions ?? [];
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.revokePreview());
  }

  ngOnInit(): void {
    this.leagueService
      .getCoachData({ suppressStatuses: [404] })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((coachData) => {
        if (coachData) this.navigateToTeam(coachData.teamSlug);
        else this.isCheckingSignUp.set(false);
      });

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((leagueInfo) => {
        this.leagueInfo.set(leagueInfo);
        this.buildAnswerControls();
      });

    this.authService.user$
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user?.sub?.startsWith('oauth2|discord') && user.username) {
          this.signupForm.controls.discordName.setValue(user.username);
        }
      });

    this.answerGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncAnswerValidators());
  }

  protected showError(control: 'name' | 'gameName' | 'discordName' | 'teamName') {
    const field = this.signupForm.controls[control];
    return field.touched && field.hasError('required');
  }

  protected visibleQuestions(): League.SignUpQuestion[] {
    return this.questions.filter((question) => {
      if (!question.dependsOn) return true;
      return (
        String(this.answerGroup.get(question.dependsOn.questionId)?.value ?? '') ===
        question.dependsOn.equals
      );
    });
  }

  protected answerInvalid(question: League.SignUpQuestion): boolean {
    const control = this.answerGroup.get(question.id);
    return !!control && control.touched && control.invalid;
  }

  protected isMultiChecked(question: League.SignUpQuestion, option: string) {
    const value = this.answerGroup.get(question.id)?.value as AnswerValue;
    return Array.isArray(value) && value.includes(option);
  }

  protected toggleMulti(question: League.SignUpQuestion, option: string) {
    const control = this.answerGroup.get(question.id);
    if (!control) return;
    const current = (control.value as string[]) ?? [];
    control.setValue(
      current.includes(option)
        ? current.filter((entry) => entry !== option)
        : [...current, option],
    );
    control.markAsTouched();
  }

  protected onLogoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.revokePreview();
    this.logoFile.set(file);
    this.logoPreview.set(file ? URL.createObjectURL(file) : null);
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting()) return;

    const tournamentSlug = this.leagueService.tournamentSlug();
    if (this.signupForm.invalid || !tournamentSlug) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const logoFile = this.logoFile();
      const logoFileKey = logoFile
        ? await this.uploadLogoAndGetFileKey(logoFile)
        : undefined;

      const { answers: rawAnswers, ...fields } = this.signupForm.getRawValue();
      const visible = new Set(this.visibleQuestions().map((q) => q.id));
      const answers: League.SignUpAnswer[] = Object.entries(
        (rawAnswers ?? {}) as Record<string, AnswerValue>,
      )
        .filter(([questionId]) => visible.has(questionId))
        .map(([questionId, value]) => ({
          questionId,
          values: (Array.isArray(value) ? value : [value]).filter(
            (entry) => `${entry}`.trim().length > 0,
          ),
        }))
        .filter((answer) => answer.values.length > 0);

      await firstValueFrom(
        this.leagueService.signUp(
          {
            ...fields,
            intent: this.wantsToSignUpAsSub() ? 'sub' : 'team',
            answers,
            ...(logoFileKey ? { logo: logoFileKey } : {}),
          },
          this.invite,
        ),
      );

      this.navigateToTeam();
    } catch (error) {
      this.submitError.set(
        (error as { message?: string })?.message ||
          'Sign up failed. Please try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildAnswerControls(): void {
    for (const question of this.questions) {
      if (this.answerGroup.contains(question.id)) continue;
      this.answerGroup.addControl(
        question.id,
        this.fb.control<AnswerValue>(question.type === 'multi' ? [] : ''),
      );
    }
    this.syncAnswerValidators();
  }

  private syncAnswerValidators(): void {
    const visible = new Set(this.visibleQuestions().map((q) => q.id));
    for (const question of this.questions) {
      const control = this.answerGroup.get(question.id);
      if (!control) continue;
      if (question.required && visible.has(question.id)) {
        control.setValidators(
          question.type === 'multi' ? Validators.minLength(1) : Validators.required,
        );
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private navigateToTeam(teamSlug?: string): void {
    const base = [
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueService.leagueSlug(),
      'tournaments',
      this.leagueService.tournamentSlug(),
    ];
    this.router.navigate(teamSlug ? [...base, 'teams', teamSlug] : base);
  }

  private revokePreview(): void {
    const preview = this.logoPreview();
    if (preview) URL.revokeObjectURL(preview);
  }

  private async uploadLogoAndGetFileKey(originalFile: File): Promise<string> {
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
      this.leagueService.getLeagueUploadPresignedUrl(
        file.name,
        file.type || 'image/png',
      ),
    );

    await firstValueFrom(
      this.uploadService.uploadToS3(presigned, file).pipe(
        filter((response) => response instanceof HttpResponse),
        map((response) => {
          if (!(response as HttpResponse<object>).ok) {
            throw new Error('The logo upload failed. Please try again.');
          }
          return response;
        }),
      ),
    );

    return presigned.key;
  }
}
