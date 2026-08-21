import { Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  model,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '@pdz/core/services/data.service';
import {
  PokemonFormGroup,
  TeamEditorComponent,
} from '@pdz/features/drafts/draft-overview/draft-form/components/team-editor/team-editor.component';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { FormatSelectComponent } from '@pdz/shared/dropdowns/format-select/format.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { BehaviorSubject, filter, Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'pdz-quick-matchup-form',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormatSelectComponent,
    RulesetSelectComponent,
    ButtonComponent,
    TeamEditorComponent,
  ],

  templateUrl: './quick-matchup-form.component.html',
  styleUrl: './quick-matchup-form.component.scss',
})
export class QuickMatchupFormComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  destroy$ = new Subject<void>();
  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);
  readonly quickForm = model<QuickForm>();

  @Output() formSubmitted = new EventEmitter<QuickForm>();

  submitAttempted = false;
  isImporting = false;

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const format: string | undefined = params['format'];
      const ruleset: string | undefined = params['ruleset'];
      const team1: DraftPokemon[] | undefined = params['team1']
        ? (Array.isArray(params['team1'])
            ? params['team1']
            : [params['team1']]
          ).map((pid) => ({ id: pid, name: getNameByPid(pid) }))
        : undefined;
      const team2: DraftPokemon[] | undefined = params['team2']
        ? (Array.isArray(params['team2'])
            ? params['team2']
            : [params['team2']]
          ).map((pid) => ({ id: pid, name: getNameByPid(pid) }))
        : undefined;
      if (!this.quickForm()) {
        this.quickForm.set(
          new QuickForm(this.pokemonList$, {
            ruleset,
            format,
            team1,
            team2,
          }),
        );
      }
      const quickForm = this.quickForm()!;
      quickForm.controls.details.controls.ruleset.valueChanges
        .pipe(
          filter((ruleset) => ruleset !== null),
          takeUntil(this.destroy$),
        )
        .subscribe((ruleset) => {
          this.loadPokemonList(ruleset);
        });
      this.loadPokemonList(quickForm.controls.details.controls.ruleset.value);
      quickForm.setValidators(this.validateDraftForm);
      quickForm.updateValueAndValidity();
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
      this.quickForm()?.controls.side1.controls.team.controls.forEach(
        (group) => {
          group.controls.pokemon.updateValueAndValidity();
        },
      );
      this.quickForm()?.controls.side2.controls.team.controls.forEach(
        (group) => {
          group.controls.pokemon.updateValueAndValidity();
        },
      );
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
    const quickForm = this.quickForm();
    if (!quickForm) return;
    this.submitAttempted = true;
    if (quickForm.valid) {
      this.formSubmitted.emit(quickForm);
    }
  }

  get side1Count(): number {
    return this.quickForm()?.controls.side1.controls.team.length ?? 0;
  }

  get side2Count(): number {
    return this.quickForm()?.controls.side2.controls.team.length ?? 0;
  }
}

export type QuickFormData = {
  format: string;
  ruleset: string;
  side1: {
    team: DraftPokemon[];
    teamName: string;
  };
  side2: {
    team: DraftPokemon[];
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
    pokemonList$: BehaviorSubject<DraftPokemon[]>,
    options: Partial<{
      ruleset: string;
      format: string;
      team1: DraftPokemon[];
      team2: DraftPokemon[];
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
