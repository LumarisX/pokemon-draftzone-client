import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueManageService } from '../league-manage.service';
import { LeagueZoneService } from '../../league-zone.service';

@Component({
  selector: 'pdz-league-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IconComponent,
    LoadingComponent,
  ],
  templateUrl: './league-settings.component.html',
  styleUrl: './league-settings.component.scss',
})
export class LeagueSettingsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private manageService = inject(LeagueManageService);
  private leagueService = inject(LeagueZoneService);
  private router = inject(Router);

  form!: FormGroup;
  isLoading = true;

  readonly adPlatformOptions = [
    'Pokémon Showdown',
    'Pokémon Champions',
    'Scarlet/Violet',
  ];
  isSaving = false;
  saveSuccess = false;
  saveError: string | null = null;

  private destroy$ = new Subject<void>();

  get leagueKey() {
    return this.leagueService.leagueKey();
  }
  get tournamentKey() {
    return this.leagueService.tournamentKey();
  }
  get managePath() {
    return `/leagues/${this.leagueKey}/tournaments/${this.tournamentKey}/manage`;
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

    this.manageService
      .getTournamentSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
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

  save(): void {
    if (this.form.invalid || this.isSaving) return;

    const v = this.form.value;
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = null;

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
        adSettings: {
          advertise: v.adAdvertise,
          skillLevelRange: { from: v.adSkillFrom, to: v.adSkillTo },
          prizeValue: v.adPrizeValue,
          platforms: this.selectedAdPlatforms(),
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saveSuccess = true;
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError =
            err?.error?.message ?? 'Failed to save settings. Please try again.';
        },
      });
  }

  get adPlatformsArray(): FormArray {
    return this.form.get('adPlatforms') as FormArray;
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
