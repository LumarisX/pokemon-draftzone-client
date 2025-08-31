import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { Pokemon } from '../../../interfaces/draft';
import { DataService } from '../../../services/data.service';
import { FormatSelectComponent } from '../../../util/format-select/format.component';
import {
  PokemonFormGroup,
  TeamFormComponent,
} from '../../../util/forms/team-form/team-form.component';
import { RulesetSelectComponent } from '../../../util/ruleset-select/ruleset.component';
import { stringify } from 'postcss';
import { getNameByPid } from '../../../data/namedex';

@Component({
  selector: 'quick-matchup-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatStepperModule,
    MatIconModule,
    FormatSelectComponent,
    TeamFormComponent,
    RulesetSelectComponent,
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: {
        displayDefaultIndicatorType: false,
        useValue: { showError: true },
      },
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  templateUrl: './quick-matchup-form.component.html',
  styleUrl: './quick-matchup-form.component.scss',
})
export class QuickMatchupFormComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  destroy$ = new Subject<void>();
  pokemonList$ = new BehaviorSubject<Pokemon[]>([]);
  @Input()
  quickForm: QuickForm | undefined;

  @Output() formSubmitted = new EventEmitter<QuickForm>();

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const format: string | undefined = params['format'];
      const ruleset: string | undefined = params['ruleset'];
      const team1: Pokemon[] | undefined = params['team1']
        ? (Array.isArray(params['team1'])
            ? params['team1']
            : [params['team1']]
          ).map((pid) => ({ id: pid, name: getNameByPid(pid) }))
        : undefined;
      const team2: Pokemon[] | undefined = params['team2']
        ? (Array.isArray(params['team2'])
            ? params['team2']
            : [params['team2']]
          ).map((pid) => ({ id: pid, name: getNameByPid(pid) }))
        : undefined;
      if (!this.quickForm) {
        this.quickForm = new QuickForm(this.pokemonList$, {
          ruleset,
          format,
          team1,
          team2,
        });
      }
      this.quickForm.controls.details.controls.ruleset.valueChanges
        .pipe(
          filter((ruleset) => ruleset !== null),
          takeUntil(this.destroy$),
        )
        .subscribe((ruleset) => {
          this.loadPokemonList(ruleset);
        });
      this.loadPokemonList(
        this.quickForm.controls.details.controls.ruleset.value,
      );
      this.quickForm.setValidators(this.validateDraftForm);
      this.location.replaceState(this.location.path().split('?')[0]);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPokemonList(ruleset: string): void {
    this.dataService.getPokemonList(ruleset).subscribe((list) => {
      this.pokemonList$.next(list);
      this.quickForm?.controls.side1.controls.team.controls.forEach((group) => {
        group.controls.pokemon.updateValueAndValidity();
      });
      this.quickForm?.controls.side2.controls.team.controls.forEach((group) => {
        group.controls.pokemon.updateValueAndValidity();
      });
    });
  }

  validateDraftForm(control: AbstractControl) {
    const quickForm = control as QuickForm;

    if (
      !quickForm.controls.side1.controls.team.value.length ||
      !quickForm.controls.side2.controls.team.value.length
    ) {
      return { emptyTeam: true };
    }
    return null;
  }

  onSubmit() {
    if (!this.quickForm) return;
    if (this.quickForm.valid) {
      this.formSubmitted.emit(this.quickForm);
      console.log('Form is valid.');
      console.log(this.quickForm.value);
      console.log(this.quickForm.toValue());
    } else {
      console.log('draft', this.quickForm.valid, this.quickForm.errors);

      console.log('Form is invalid.');
    }
  }

  openLink(url: string) {
    let trimmed = url.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    window.open(trimmed, '_blank');
  }
}

export type QuickFormData = {
  format: string;
  ruleset: string;
  side1: {
    team: Pokemon[];
    teamName: string;
  };
  side2: {
    team: Pokemon[];
    teamName: string;
  };
};

export class QuickForm extends FormGroup<{
  details: FormGroup<{
    format: FormControl<string>;
    ruleset: FormControl<string>;
  }>;
  side1: FormGroup<{
    team: FormArray<PokemonFormGroup>;
    teamName: FormControl<string>;
  }>;
  side2: FormGroup<{
    team: FormArray<PokemonFormGroup>;
    teamName: FormControl<string>;
  }>;
}> {
  constructor(
    pokemonList$: BehaviorSubject<Pokemon[]>,
    options: Partial<{
      ruleset: string;
      format: string;
      team1: Pokemon[];
      team2: Pokemon[];
    }> = {},
  ) {
    super({
      details: new FormGroup({
        format: new FormControl(options.format ?? 'Singles', {
          nonNullable: true,
          validators: Validators.required,
        }),
        ruleset: new FormControl(options.ruleset ?? 'Gen9 NatDex', {
          nonNullable: true,
          validators: Validators.required,
        }),
      }),
      side1: new FormGroup({
        team: new FormArray(
          options.team1?.map(
            (pokemon) => new PokemonFormGroup(pokemon, pokemonList$),
          ) ?? ([] as PokemonFormGroup[]),
        ),
        teamName: new FormControl('', {
          nonNullable: true,
        }),
      }),
      side2: new FormGroup({
        team: new FormArray(
          options.team2?.map(
            (pokemon) => new PokemonFormGroup(pokemon, pokemonList$),
          ) ?? ([] as PokemonFormGroup[]),
        ),
        teamName: new FormControl('', {
          nonNullable: true,
        }),
      }),
    });
  }

  toValue(): QuickFormData {
    return {
      format: this.controls.details.controls.format.value,
      ruleset: this.controls.details.controls.ruleset.value,
      side1: {
        team: this.controls.side1.controls.team.controls.map((pokemonGroup) =>
          pokemonGroup.toPokemon(),
        ),
        teamName: this.controls.side1.controls.teamName.value,
      },
      side2: {
        team: this.controls.side2.controls.team.controls.map((pokemonGroup) =>
          pokemonGroup.toPokemon(),
        ),
        teamName: this.controls.side2.controls.teamName.value,
      },
    };
  }
}
