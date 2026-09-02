import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  input,
  signal,
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
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { DataService } from '@pdz/core/services/data.service';
import {
  PokemonFormGroup,
  TeamEditorComponent,
} from '@pdz/features/drafts/draft-overview/draft-form/components/team-editor/team-editor.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { DraftService } from '../../../draft-overview/draft.service';
import { Draft, DraftPokemon } from '../../../draft.model';
import {
  MatchTimeDialogComponent,
  MatchTimeDialogData,
  MatchTimeDialogResult,
} from '@pdz/shared/time/match-time-dialog/match-time-dialog.component';
import { Opponent } from '../../opponent.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  FieldErrorDirective,
} from '@pdz/shared/inputs/field/field-message.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';

@Component({
  selector: 'pdz-opponent-form-core',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    TeamEditorComponent,
    FieldComponent,
    InputDirective,
    FieldErrorDirective,
    ButtonComponent,
    CountdownComponent,
  ],
  templateUrl: './opponent-form-core.component.html',
  styleUrl: './opponent-form-core.component.scss',
})
export class OpponentFormCoreComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private draftService = inject(DraftService);
  private dialogs = inject(DialogService);

  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);
  opponentForm!: OpponentForm;
  isImporting = false;
  submitAttempted = false;

  readonly scheduledDate = signal<string | null>(null);
  readonly opponentTimezone = signal<string | null>(null);

  readonly draftPath = DRAFT_OVERVIEW_PATH;
  teamId: string = '';

  readonly title = input('New Opponent');
  readonly submitLabel = input('Save Opponent');
  readonly params = input<Partial<Opponent>>({});
  @Output() formSubmitted = new EventEmitter<OpponentFormData>();

  ruleset!: string;
  draft!: Observable<Draft>;

  ngOnInit(): void {
    this.draft = this.route.parent!.paramMap.pipe(
      switchMap((params) => {
        this.teamId = params.get('teamId')!;
        return this.draftService.getDraft(this.teamId);
      }),
    );
    this.opponentForm = new OpponentForm(this.params(), this.pokemonList$);
    this.scheduledDate.set(this.params().scheduledDate ?? null);
    this.opponentTimezone.set(this.params().opponentTimezone ?? null);
    this.draft.subscribe((draft) => {
      this.ruleset = draft.ruleset;
      this.dataService.getPokemonList(draft.ruleset).subscribe((pokemon) => {
        this.pokemonList$.next(pokemon);
      });
    });
    this.opponentForm.setValidators(this.validateDraftForm);
  }

  showError(control: FormControl, error: string): boolean {
    return control.hasError(error) && (control.touched || this.submitAttempted);
  }

  get teamNameControl(): FormControl<string> {
    return this.opponentForm.controls.details.controls.teamName;
  }

  get stageControl(): FormControl<string> {
    return this.opponentForm.controls.details.controls.stage;
  }

  get teamCount(): number {
    return this.opponentForm?.controls.team.length ?? 0;
  }

  validateDraftForm(control: AbstractControl) {
    const formGroup = control as FormGroup;
    const teamArray = formGroup.get('team') as FormArray;
    if (teamArray.length === 0) {
      return { emptyTeam: true };
    }
    return null;
  }

  scheduledLabel(): string | null {
    const scheduled = this.scheduledDate();
    if (!scheduled) return null;
    const date = new Date(scheduled);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  async editMatchTime() {
    const result = await this.dialogs.open<
      MatchTimeDialogComponent,
      MatchTimeDialogResult,
      MatchTimeDialogData
    >(MatchTimeDialogComponent, {
      heading: this.scheduledDate() ? 'Edit Match Time' : 'Set Match Time',
      size: 'lg',
      data: {
        opponentName: this.teamNameControl.value,
        scheduledDate: this.scheduledDate(),
        opponentTimezone: this.opponentTimezone(),
      },
    }).closed;

    if (!result) return;
    this.scheduledDate.set(result.scheduledDate);
    this.opponentTimezone.set(result.opponentTimezone ?? null);
  }

  onSubmit() {
    this.submitAttempted = true;
    if (this.opponentForm.valid) {
      this.formSubmitted.emit({
        ...this.opponentForm.toValue(),
        scheduledDate: this.scheduledDate(),
        opponentTimezone: this.opponentTimezone() ?? undefined,
      });
    } else {
      this.opponentForm.markAllAsTouched();
    }
  }
}

export type OpponentFormData = {
  stage: string;
  teamName: string;
  coach: string;
  team: DraftPokemon[];
  scheduledDate: string | null;
  opponentTimezone?: string;
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
    pokemonList$: BehaviorSubject<DraftPokemon[]>,
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

  toValue(): Omit<OpponentFormData, 'scheduledDate' | 'opponentTimezone'> {
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
