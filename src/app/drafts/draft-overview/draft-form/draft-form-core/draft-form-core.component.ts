import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
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
import { RouterModule } from '@angular/router';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../../../services/data.service';
import { Draft, Pokemon } from '../../../../interfaces/draft';
import { FormatSelectComponent } from '../../../../util/format-select/format.component';
import {
  PokemonFormGroup,
  TeamFormComponent,
} from '../../../../util/forms/team-form/team-form.component';
import { RulesetSelectComponent } from '../../../../util/ruleset-select/ruleset.component';

@Component({
  selector: 'draft-form-core',
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
  templateUrl: './draft-form-core.component.html',
  styleUrl: './draft-form-core.component.scss',
})
export class DraftFormCoreComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);

  destroy$ = new Subject<void>();
  pokemonList$ = new BehaviorSubject<Pokemon[]>([]);
  draftForm!: DraftForm;

  @Input()
  params: Partial<Draft> = {};
  @Output() formSubmitted = new EventEmitter<DraftFormData>();

  ngOnInit(): void {
    this.draftForm = new DraftForm(this.params, this.pokemonList$);
    this.draftForm.controls.details.controls.ruleset.valueChanges
      .pipe(
        filter((ruleset) => ruleset !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((ruleset) => {
        this.loadPokemonList(ruleset);
      });
    this.loadPokemonList(
      this.draftForm.controls.details.controls.ruleset.value,
    );
    this.draftForm.setValidators(this.validateDraftForm);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPokemonList(ruleset: string): void {
    this.dataService.getPokemonList(ruleset).subscribe((list) => {
      this.pokemonList$.next(list);
      this.draftForm.controls.team.controls.forEach((group) => {
        group.controls.pokemon.updateValueAndValidity();
      });
    });
  }

  validateDraftForm(control: AbstractControl) {
    const formGroup = control as FormGroup;
    const teamArray = formGroup.get('team') as FormArray;
    if (teamArray.length === 0) {
      return { emptyTeam: true };
    }
    return null;
  }

  onSubmit() {
    if (this.draftForm.valid) {
      this.formSubmitted.emit(this.draftForm.toValue());
      console.log('Form is valid.');
      console.log(this.draftForm.value);
      console.log(this.draftForm.toValue());
    } else {
      console.log('draft', this.draftForm.valid, this.draftForm.errors);
      console.log(
        'team',
        this.draftForm.controls.team.valid,
        this.draftForm.controls.team.errors,
      );
      this.draftForm.controls.team;

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

export type DraftFormData = {
  leagueName: string;
  teamName: string;
  format: string;
  ruleset: string;
  doc: string | undefined;
  team: Pokemon[];
};

export class DraftForm extends FormGroup<{
  details: FormGroup<{
    leagueName: FormControl<string>;
    teamName: FormControl<string>;
    format: FormControl<string>;
    ruleset: FormControl<string>;
    doc: FormControl<string>;
  }>;
  team: FormArray<PokemonFormGroup>;
}> {
  constructor(
    params: Partial<Draft>,
    pokemonList$: BehaviorSubject<Pokemon[]>,
  ) {
    super({
      details: new FormGroup({
        leagueName: new FormControl(params?.leagueName ?? '', {
          nonNullable: true,
          validators: Validators.required,
        }),
        teamName: new FormControl(params?.teamName ?? '', {
          nonNullable: true,
          validators: Validators.required,
        }),
        format: new FormControl(params?.format ?? 'Singles', {
          nonNullable: true,
          validators: Validators.required,
        }),
        ruleset: new FormControl(params?.ruleset ?? 'Gen9 NatDex', {
          nonNullable: true,
          validators: Validators.required,
        }),
        doc: new FormControl(params?.doc ?? '', {
          nonNullable: true,
        }),
      }),
      team: new FormArray(
        params.team
          ? params.team.map(
              (pokemon) => new PokemonFormGroup(pokemon, pokemonList$),
            )
          : ([] as PokemonFormGroup[]),
      ),
    });
  }

  toValue(): DraftFormData {
    return {
      leagueName: this.controls.details.controls.leagueName.value,
      teamName: this.controls.details.controls.teamName.value,
      format: this.controls.details.controls.format.value,
      ruleset: this.controls.details.controls.ruleset.value,
      doc: this.controls.details.controls.doc.value || undefined,
      team: this.controls.team.controls.map((pokemonGroup) =>
        pokemonGroup.toPokemon(),
      ),
    };
  }
}
