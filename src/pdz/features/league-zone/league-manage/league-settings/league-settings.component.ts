import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  catchError,
  forkJoin,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { UploadService } from '@pdz/core/services/upload.service';
import { LeagueManageService } from '../league-manage.service';
import { LeagueZoneService } from '../../league-zone.service';
import { getLeagueLogoUrl } from '../../league.util';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

const NON_DRAFTABLE_TIER_NAMES = new Set(['untiered', 'ban', 'banned']);

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

@Component({
  selector: 'pdz-league-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IconComponent,
    LoadingComponent,
    ButtonComponent,
  ],
  templateUrl: './league-settings.component.html',
  styleUrl: './league-settings.component.scss',
})
export class LeagueSettingsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private manageService = inject(LeagueManageService);
  private leagueService = inject(LeagueZoneService);
  private tierListService = inject(TierListService);
  private uploadService = inject(UploadService);
  private router = inject(Router);

  @ViewChild('logoInput') logoInputRef!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isLoading = true;
  availableTierNames: string[] = [];

  /** Currently persisted logo key, `null` if none is set. */
  currentLogoKey: string | null = null;
  /** `undefined` = no change staged; `null` = staged removal; string = newly uploaded key. */
  pendingLogo: string | null | undefined = undefined;
  isUploadingLogo = false;
  logoUploadProgress = 0;
  logoUploadError: string | null = null;

  get displayedLogoKey(): string | null {
    return this.pendingLogo !== undefined
      ? this.pendingLogo
      : this.currentLogoKey;
  }

  get displayedLogoUrl(): string | undefined {
    return getLeagueLogoUrl(this.displayedLogoKey ?? undefined);
  }

  readonly adPlatformOptions = [
    'Pokémon Showdown',
    'Pokémon Champions',
    'Scarlet/Violet',
  ];
  isSaving = false;
  saveSuccess = false;
  saveError: string | null = null;

  private destroy$ = new Subject<void>();

  get leagueSlug() {
    return this.leagueService.leagueSlug();
  }
  get tournamentSlug() {
    return this.leagueService.tournamentSlug();
  }
  get managePath() {
    return `/leagues/${this.leagueSlug}/tournaments/${this.tournamentSlug}/manage`;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      description: [''],
      format: ['', Validators.required],
      ruleset: ['', Validators.required],
      discord: [''],
      discordGuildId: [''],
      discordCoachRoleId: [''],
      discordSignUpChannelId: [''],
      signUpDeadline: ['', Validators.required],
      draftStart: [''],
      draftEnd: [''],
      seasonStart: [''],
      seasonEnd: [''],
      diffMode: ['pokemon', Validators.required],
      forfeitGameDiff: [0, [Validators.required, Validators.min(0)]],
      forfeitPokemonDiff: [0, [Validators.required, Validators.min(0)]],
      matchupChat: [true],
      coachReporting: [true],
      draftCountMin: [1, [Validators.required, Validators.min(1)]],
      draftCountMax: [1, [Validators.required, Validators.min(1)]],
      pointTotalEnabled: [false],
      pointTotal: [0, Validators.min(0)],
      tradePointLimitEnabled: [false],
      tradePointLimit: [0, Validators.min(0)],
      tierRequirements: this.fb.array<
        FormGroup<{
          tierName: FormControl<string>;
          required: FormControl<number>;
        }>
      >([]),
      adAdvertise: [false],
      adSkillFrom: ['0'],
      adSkillTo: ['3'],
      adPrizeValue: ['0'],
      adPlatforms: this.fb.array<FormControl<boolean>>(
        this.adPlatformOptions.map(
          (platform) =>
            new FormControl(platform === 'Pokémon Showdown', {
              nonNullable: true,
            }),
        ),
      ),
    });

    forkJoin({
      settings: this.manageService.getTournamentSettings(),
      tierList: this.tierListService
        .getTierList()
        .pipe(catchError(() => of({ tierList: [] as { name: string }[] }))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ settings, tierList }) => {
          this.currentLogoKey = settings.logo ?? null;
          this.pendingLogo = undefined;
          this.form.patchValue({
            name: settings.name,
            description: settings.description ?? '',
            format: settings.format,
            ruleset: settings.ruleset,
            discord: settings.discord ?? '',
            discordGuildId: settings.discordSettings?.guildId ?? '',
            discordCoachRoleId: settings.discordSettings?.coachRoleId ?? '',
            discordSignUpChannelId:
              settings.discordSettings?.signUpChannelId ?? '',
            signUpDeadline: settings.signUpDeadline
              ? this.toDateInput(settings.signUpDeadline)
              : '',
            draftStart: settings.draftStart
              ? this.toDateInput(settings.draftStart)
              : '',
            draftEnd: settings.draftEnd
              ? this.toDateInput(settings.draftEnd)
              : '',
            seasonStart: settings.seasonStart
              ? this.toDateInput(settings.seasonStart)
              : '',
            seasonEnd: settings.seasonEnd
              ? this.toDateInput(settings.seasonEnd)
              : '',
            diffMode: settings.diffMode ?? 'pokemon',
            forfeitGameDiff: settings.forfeit?.gameDiff ?? 0,
            forfeitPokemonDiff: settings.forfeit?.pokemonDiff ?? 0,
            matchupChat: settings.matchSettings?.chat !== false,
            coachReporting: settings.matchSettings?.coachReporting !== false,
            draftCountMin: settings.draftCount?.min ?? 1,
            draftCountMax: settings.draftCount?.max ?? 1,
            pointTotalEnabled: settings.pointTotal != null,
            pointTotal: settings.pointTotal ?? 0,
            tradePointLimitEnabled: settings.tradePointLimit != null,
            tradePointLimit: settings.tradePointLimit ?? 0,
            adAdvertise: settings.adSettings?.advertise ?? false,
            adSkillFrom: settings.adSettings?.skillLevelRange?.from ?? '0',
            adSkillTo: settings.adSettings?.skillLevelRange?.to ?? '3',
            adPrizeValue: settings.adSettings?.prizeValue ?? '0',
          });
          if (settings.adSettings?.platforms?.length) {
            this.adPlatformsArray.setValue(
              this.adPlatformOptions.map((platform) =>
                settings.adSettings!.platforms!.includes(platform),
              ),
            );
          }

          const requirementByTier = new Map(
            settings.tierRequirements.map((req) => [
              req.tierName,
              req.required,
            ]),
          );
          this.availableTierNames = tierList.tierList
            .map((tier) => tier.name)
            .filter(
              (name) =>
                !NON_DRAFTABLE_TIER_NAMES.has(name.trim().toLowerCase()),
            );
          this.tierRequirementsArray.clear();
          for (const tierName of this.availableTierNames) {
            this.tierRequirementsArray.push(
              this.fb.group({
                tierName: this.fb.nonNullable.control(tierName),
                required: this.fb.nonNullable.control(
                  requirementByTier.get(tierName) ?? 0,
                  [Validators.required, Validators.min(0)],
                ),
              }),
            );
          }

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Sum of required picks across all tiers. */
  get tierRequirementsTotal(): number {
    return this.tierRequirementsArray.controls.reduce(
      (sum, ctrl) => sum + (Number(ctrl.get('required')?.value) || 0),
      0,
    );
  }

  get tierRequirementsExceedMax(): boolean {
    const max = Number(this.form.get('draftCountMax')?.value ?? 0);
    return this.tierRequirementsTotal > max;
  }

  save(): void {
    if (this.form.invalid || this.isSaving || this.tierRequirementsExceedMax)
      return;

    const v = this.form.value;
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = null;

    const tierRequirements = (
      v.tierRequirements as { tierName: string; required: number }[]
    ).filter((req) => req.required > 0);

    this.manageService
      .updateTournamentSettings({
        name: v.name,
        description: v.description || undefined,
        format: v.format,
        ruleset: v.ruleset,
        signUpDeadline: new Date(v.signUpDeadline),
        draftStart: v.draftStart ? new Date(v.draftStart) : undefined,
        draftEnd: v.draftEnd ? new Date(v.draftEnd) : undefined,
        seasonStart: v.seasonStart ? new Date(v.seasonStart) : undefined,
        seasonEnd: v.seasonEnd ? new Date(v.seasonEnd) : undefined,
        discord: v.discord || undefined,
        logo: this.pendingLogo,
        discordSettings: {
          guildId: v.discordGuildId || undefined,
          coachRoleId: v.discordCoachRoleId || undefined,
          signUpChannelId: v.discordSignUpChannelId || undefined,
        },
        forfeit: {
          gameDiff: v.forfeitGameDiff,
          pokemonDiff: v.forfeitPokemonDiff,
        },
        diffMode: v.diffMode,
        draftCount: { min: v.draftCountMin, max: v.draftCountMax },
        pointTotal: v.pointTotalEnabled ? v.pointTotal : null,
        tradePointLimit: v.tradePointLimitEnabled ? v.tradePointLimit : null,
        tierRequirements,
        adSettings: {
          advertise: v.adAdvertise,
          skillLevelRange: { from: v.adSkillFrom, to: v.adSkillTo },
          prizeValue: v.adPrizeValue,
          platforms: this.selectedAdPlatforms(),
        },
        matchSettings: {
          chat: v.matchupChat,
          coachReporting: v.coachReporting,
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saveSuccess = true;
          if (this.pendingLogo !== undefined) {
            this.currentLogoKey = this.pendingLogo;
            this.pendingLogo = undefined;
          }
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError =
            err?.error?.message ?? 'Failed to save settings. Please try again.';
        },
      });
  }

  openLogoInput(): void {
    this.logoInputRef.nativeElement.click();
  }

  onLogoFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    element.value = '';
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      this.logoUploadError = `Invalid file type. Allowed: ${ALLOWED_LOGO_TYPES.join(', ')}`;
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      this.logoUploadError = `File size exceeds maximum (${MAX_LOGO_SIZE / 1024 / 1024}MB)`;
      return;
    }

    this.logoUploadError = null;
    this.isUploadingLogo = true;
    this.logoUploadProgress = 0;

    this.uploadService
      .getPresignedUploadUrl(file.name, file.type, 'tournament-logos')
      .pipe(
        switchMap((res) => {
          const key = res.key;
          return this.uploadService.uploadToS3(res.url, file).pipe(
            tap((event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.logoUploadProgress = Math.round(
                  (100 * event.loaded) / event.total,
                );
              } else if (event instanceof HttpResponse && event.ok) {
                this.pendingLogo = key;
              }
            }),
          );
        }),
        catchError((err) => {
          this.logoUploadError =
            err?.error?.message ?? 'Failed to upload logo. Please try again.';
          return of(null);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        complete: () => {
          this.isUploadingLogo = false;
        },
      });
  }

  removeLogo(): void {
    this.pendingLogo = null;
    this.logoUploadError = null;
  }

  get adPlatformsArray(): FormArray {
    return this.form.get('adPlatforms') as FormArray;
  }

  get tierRequirementsArray(): FormArray {
    return this.form.get('tierRequirements') as FormArray;
  }

  private selectedAdPlatforms(): string[] {
    return this.adPlatformsArray.controls
      .map((ctrl, index) => (ctrl.value ? this.adPlatformOptions[index] : null))
      .filter((platform): platform is string => platform !== null);
  }

  cancel(): void {
    this.router.navigate([this.managePath]);
  }

  private toDateInput(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
