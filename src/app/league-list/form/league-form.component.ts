import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LeagueAdsService } from '../../services/league-ads.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'pdz-league-form',
  templateUrl: './league-form.component.html',
  styleUrls: ['./league-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class LeagueFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private leagueService = inject(LeagueAdsService);
  private dataService = inject(DataService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  leagueForm!: FormGroup;
  formats: string[] = [];
  rulesets: string[] = [];
  platforms: string[] = ['Pokémon Showdown', 'Scarlet/Violet'];
  isSubmitting = false;

  readonly MILLISECONDS_IN_WEEK = 604800000;
  readonly DEFAULT_SKILL_LEVEL_FROM = '0';
  readonly DEFAULT_SKILL_LEVEL_TO = '3';
  readonly DEFAULT_PRIZE_VALUE = '0';
  readonly DEFAULT_PLATFORMS = ['Pokémon Showdown'];
  readonly DEFAULT_FORMATS = ['Singles'];
  readonly DEFAULT_RULESETS = ['Gen9 NatDex'];
  readonly LEAGUE_NAME_MAX_LENGTH = 100;
  readonly DESCRIPTION_MAX_LENGTH = 1000;

  ngOnInit(): void {
    this.initializeForm();
    this.loadFormData();
  }

  private initializeForm(): void {
    const defaultCloseDate = this.getDefaultCloseDate();

    this.leagueForm = this.fb.group({
      leagueName: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.LEAGUE_NAME_MAX_LENGTH),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.DESCRIPTION_MAX_LENGTH),
        ],
      ],
      leagueDoc: ['', [Validators.maxLength(100)]],
      serverLink: ['', [Validators.maxLength(100)]],
      skillLevelRange: this.fb.group({
        from: [this.DEFAULT_SKILL_LEVEL_FROM, Validators.required],
        to: [this.DEFAULT_SKILL_LEVEL_TO, Validators.required],
      }),
      prizeValue: [this.DEFAULT_PRIZE_VALUE, Validators.required],
      platforms: this.fb.array<FormControl<boolean>>(
        [],
        [this.minSelectedValidator(1)],
      ),
      formats: this.fb.array<FormControl<boolean>>(
        [],
        [this.minSelectedValidator(1)],
      ),
      rulesets: this.fb.array<FormControl<boolean>>(
        [],
        [this.minSelectedValidator(1)],
      ),
      signupLink: ['', [Validators.required, Validators.maxLength(100)]],
      closesAt: [defaultCloseDate, Validators.required],
      seasonStart: [''],
      seasonEnd: [''],
    });

    // Initialize platforms array with defaults
    this.initializePlatformsArray();
  }

  private initializePlatformsArray(): void {
    const platformsArray = this.leagueForm.get('platforms') as FormArray;
    this.platforms.forEach((platform) => {
      platformsArray.push(
        new FormControl(this.DEFAULT_PLATFORMS.includes(platform)),
      );
    });
  }

  private minSelectedValidator(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;
      const selectedCount = formArray.controls.filter(
        (ctrl) => ctrl.value === true,
      ).length;
      return selectedCount >= min
        ? null
        : { minSelected: { min, actual: selectedCount } };
    };
  }

  private loadFormData(): void {
    this.dataService
      .getFormats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (formats) => {
          this.formats = formats;
          this.initializeFormatsArray();
        },
        error: (error) => {
          console.error('Error loading formats:', error);
        },
      });

    this.dataService
      .getRulesets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rulesets) => {
          this.rulesets = rulesets;
          this.initializeRulesetsArray();
        },
        error: (error) => {
          console.error('Error loading rulesets:', error);
        },
      });
  }

  private initializeFormatsArray(): void {
    const formatsArray = this.leagueForm.get('formats') as FormArray;
    this.formats.forEach((format) => {
      formatsArray.push(new FormControl(this.DEFAULT_FORMATS.includes(format)));
    });
  }

  private initializeRulesetsArray(): void {
    const rulesetsArray = this.leagueForm.get('rulesets') as FormArray;
    this.rulesets.forEach((ruleset) => {
      rulesetsArray.push(
        new FormControl(this.DEFAULT_RULESETS.includes(ruleset)),
      );
    });
  }

  private getDefaultCloseDate(): string {
    const defaultDate = new Date(Date.now() + this.MILLISECONDS_IN_WEEK);
    return defaultDate.toISOString().substring(0, 10);
  }

  onSubmit(): void {
    if (this.leagueForm.invalid || this.isSubmitting) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.leagueService
      .newAd(this.getFormValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/league-list/manage']);
        },
        error: (error) => {
          console.error('Error submitting league ad:', error);
          this.isSubmitting = false;
        },
      });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.leagueForm.controls).forEach((key) => {
      const control = this.leagueForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((subKey) => {
          control.get(subKey)?.markAsTouched();
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.leagueForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  get platformsArray(): FormArray {
    return this.leagueForm.get('platforms') as FormArray;
  }

  get formatsArray(): FormArray {
    return this.leagueForm.get('formats') as FormArray;
  }

  get rulesetsArray(): FormArray {
    return this.leagueForm.get('rulesets') as FormArray;
  }

  getSelectedValues(
    formArrayName: 'platforms' | 'formats' | 'rulesets',
  ): string[] {
    const formArray = this.leagueForm.get(formArrayName) as FormArray;
    const sourceArray =
      formArrayName === 'platforms'
        ? this.platforms
        : formArrayName === 'formats'
          ? this.formats
          : this.rulesets;

    return formArray.controls
      .map((ctrl, index) => (ctrl.value ? sourceArray[index] : null))
      .filter((value): value is string => value !== null);
  }

  getFormValue(): Record<string, unknown> {
    const formValue = { ...this.leagueForm.value };
    formValue['platforms'] = this.getSelectedValues('platforms');
    formValue['formats'] = this.getSelectedValues('formats');
    formValue['rulesets'] = this.getSelectedValues('rulesets');
    return formValue;
  }
}
