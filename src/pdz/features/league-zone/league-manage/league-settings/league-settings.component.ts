import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
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
      signUpDeadline: ['', Validators.required],
      draftStart: [''],
      draftEnd: [''],
      seasonStart: [''],
      seasonEnd: [''],
      diffMode: ['pokemon', Validators.required],
      forfeitGameDiff: [0, [Validators.required, Validators.min(0)]],
      forfeitPokemonDiff: [0, [Validators.required, Validators.min(0)]],
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
          });
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
        forfeit: {
          gameDiff: v.forfeitGameDiff,
          pokemonDiff: v.forfeitPokemonDiff,
        },
        diffMode: v.diffMode,
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

  cancel(): void {
    this.router.navigate([this.managePath]);
  }

  private toDateInput(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
