import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../../../services/data.service';
import { Pokemon } from '../../../../interfaces/draft';
import { Opponent } from '../../../../interfaces/opponent';
import {
  PokemonFormGroup,
  TeamFormComponent,
} from '../../../../util/forms/team-form/team-form.component';

@Component({
  selector: 'opponent-form-core',
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
    TeamFormComponent,
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
  templateUrl: './opponent-form-core.component.html',
  styleUrl: './opponent-form-core.component.scss',
})
export class OpponentFormCoreComponent implements OnInit {
  private dataService = inject(DataService);

  pokemonList$ = new BehaviorSubject<Pokemon[]>([]);
  opponentForm!: OpponentForm;

  @Input()
  params: Partial<Opponent> = {};
  @Input()
  ruleset: string | null = null;
  @Output() formSubmitted = new EventEmitter<OpponentFormData>();

  ngOnInit(): void {
    this.opponentForm = new OpponentForm(this.params, this.pokemonList$);
    this.loadPokemonList(this.ruleset);
    this.opponentForm.setValidators(this.validateDraftForm);
  }

  private loadPokemonList(ruleset: string | null): void {
    this.dataService.getPokemonList(ruleset).subscribe((list) => {
      this.pokemonList$.next(list);
      this.opponentForm.controls.team.controls.forEach((group) => {
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
    if (this.opponentForm.valid) {
      this.formSubmitted.emit(this.opponentForm.toValue());
      console.log('Form is valid.');
      console.log(this.opponentForm.value);
      console.log(this.opponentForm.toValue());
    } else {
      console.log('draft', this.opponentForm.valid, this.opponentForm.errors);
      console.log(
        'team',
        this.opponentForm.controls.team.valid,
        this.opponentForm.controls.team.errors,
      );
      this.opponentForm.controls.team;
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

export type OpponentFormData = {
  stage: string;
  teamName: string;
  coach: string;
  team: Pokemon[];
};

export class OpponentForm extends FormGroup<{
  details: FormGroup<{
    teamName: FormControl<string>;
    coach: FormControl<string>;
    stage: FormControl<string>;
  }>;
  team: FormArray<PokemonFormGroup>;
}> {
  constructor(
    params: Partial<Opponent>,
    pokemonList$: BehaviorSubject<Pokemon[]>,
  ) {
    super({
      details: new FormGroup({
        teamName: new FormControl(params?.teamName ?? '', {
          nonNullable: true,
          validators: Validators.required,
        }),
        coach: new FormControl(params?.coach ?? '', {
          nonNullable: true,
        }),
        stage: new FormControl(params?.stage ?? 'Week 1', {
          nonNullable: true,
          validators: Validators.required,
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

  toValue(): OpponentFormData {
    return {
      stage: this.controls.details.controls.stage.value,
      teamName: this.controls.details.controls.teamName.value,
      coach: this.controls.details.controls.coach.value,
      team: this.controls.team.controls.map((pokemonGroup) =>
        pokemonGroup.toPokemon(),
      ),
    };
  }
}
