import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { includeName } from '../../../../../utils/utils';
import { DataService } from '../../../api/data.service';
import { TERATYPES, TYPES } from '../../../data';
import { getPidByName } from '../../../data/namedex';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { SlideToggleComponent } from '../../inputs/slide-toggle/slide-toggle.component';
import { PokemonSelectComponent } from '../../pokemon-select/pokemon-select.component';

@Component({
  selector: 'team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatRippleModule,
    CdkAccordionModule,
    SpriteComponent,
    SlideToggleComponent,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    CdkDragPreview,
    PokemonSelectComponent,
  ],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  animations: [
    trigger('rotateIcon', [
      state('expanded', style({ transform: 'rotate(180deg)' })),
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      transition('collapsed => expanded', animate('500ms ease-in-out')),
      transition('expanded => collapsed', animate('500ms ease-in-out')),
    ]),
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
      ),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [animate('500ms ease-in-out')]),
    ]),
  ],
})
export class TeamFormComponent implements OnInit {
  ruleset$ = new BehaviorSubject<string | null>(null);
  @Input() set ruleset(value: string | null) {
    this.ruleset$.next(value);
  }

  @Input()
  teamArray!: FormArray<PokemonFormGroup>;

  get ruleset(): string | null {
    return this.ruleset$.value;
  }

  readonly teraTypes = TERATYPES;
  readonly zTypes = TYPES;
  readonly keywords = signal<string[]>([]);

  importing = false;
  importInput = '';
  teamOption = false;

  checked = false;
  destroy$ = new Subject<void>();

  pokemonList$ = new BehaviorSubject<Pokemon[]>([]);
  formeFilter = new FormControl<string>('');

  formeOptions: Pokemon[] = [
    { id: 'miniormeteor', name: 'Minior-Meteor' },
    { id: 'deoxysdefense', name: 'Deoxys-Defense' },
    { id: 'deoxys', name: 'Deoxys' },
    { id: 'deoxysspeed', name: 'Deoxys-Speed' },
  ];

  filteredFormeOptions: Pokemon[] = [...this.formeOptions];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    this.ruleset$
      .asObservable()
      .pipe(
        filter((ruleset) => ruleset !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((ruleset) => {
        this.dataService.getPokemonList(ruleset).subscribe((list) => {
          this.pokemonList$.next(list);
          this.teamArray.controls.forEach((group) => {
            group.controls.pokemon.updateValueAndValidity();
          });
        });
      });

    this.formeFilter.valueChanges
      .pipe(
        filter((value) => value !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.filterFormes(value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeChip(control: FormControl<any[] | null>, index: number) {
    if (!control.value) return;
    const updatedMoves = [...control.value];
    updatedMoves.splice(index, 1);
    control.setValue(updatedMoves);
  }

  addForme(control: FormControl<Pokemon[] | null>, event: MatChipInputEvent) {
    const value = event.value.trim();
    if (value) {
      control.setValue([...(control.value ?? []), { id: value, name: value }]);
    }
    event.chipInput.clear();
  }

  addChip(control: FormControl<string[] | null>, event: MatChipInputEvent) {
    const value = event.value.trim();
    if (value) {
      control.setValue([...(control.value ?? []), value]);
    }
    event.chipInput.clear();
  }

  selectedForme(
    control: FormControl<Pokemon[] | null>,
    event: MatAutocompleteSelectedEvent,
  ) {
    control.setValue([...(control.value ?? []), event.option.value]);
    this.resetFormeField();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.teamArray.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  handlePokemonInput(event?: Event): void {
    event?.preventDefault();
    const pokemonNames = this.importInput
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    pokemonNames.forEach((name) => {
      this.teamArray.push(
        new PokemonFormGroup(
          { name: name, id: getPidByName(name) },
          this.pokemonList$,
        ),
      );
    });

    this.importInput = '';
  }

  addPokemon(pokemon: Pokemon | null) {
    if (
      pokemon &&
      this.teamArray.controls.every(
        (pControl) => pControl.value.pokemon?.id !== pokemon.id,
      )
    ) {
      this.teamArray.push(new PokemonFormGroup(pokemon, this.pokemonList$));
    }
  }

  deletePokemon(index: number) {
    this.teamArray.removeAt(index);
  }

  addAllTypes(control: FormControl<string[] | null>, types: readonly string[]) {
    control.setValue([...types]);
  }

  toggleType(
    control: FormControl<string[] | null>,
    type: string,
    remove: boolean = true,
  ) {
    if (remove) {
      if (!control.value) return;
      control.setValue(control.value.filter((t) => t !== type));
    } else {
      if (control.value?.includes(type)) return;
      control.setValue([...(control.value || []), type]);
    }
  }

  filterFormes(searchText: string) {
    if (!searchText) {
      this.filteredFormeOptions = [...this.formeOptions];
      return;
    }
    this.filteredFormeOptions = this.formeOptions.filter((forme) =>
      includeName(forme.name, searchText),
    );
  }

  displayFn(forme?: any): string {
    return forme ? forme.name : '';
  }

  resetFormeField() {
    this.formeFilter.setValue('');
  }

  validControl(
    control: AbstractControl<any[] | string | boolean | null> | null,
  ): boolean {
    const value = control?.value;
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value;
  }

  checkPartial(controlName: string) {
    return this.teamArray.controls.some((control) => {
      let valid = this.validControl(control.get(controlName));
      return valid;
    });
  }

  checkTeraPartial() {
    return this.teamArray.controls.some((control) => {
      let valid =
        control.controls.tera.value && control.controls.tera.value.length > 0;
      return valid;
    });
  }

  isAllSelected(controlName: string): boolean {
    return this.teamArray.controls.every((group) => {
      const value = group.get(controlName)?.value;
      if (Array.isArray(value)) return value.length;
      return value;
    });
  }

  partialSelected(controlName: string): boolean {
    const hasSelected = this.teamArray.controls.some((group) => {
      const value = group.get(controlName)?.value;
      if (Array.isArray(value)) return value.length;
      return value;
    });
    const isNotAll = !this.isAllSelected(controlName);
    return hasSelected && isNotAll;
  }

  toggleTeamControl(controlName: string, isChecked: boolean): void {
    this.teamArray.controls.forEach((group) => {
      group.get(controlName)?.setValue(isChecked ? [...this.teraTypes] : null);
      group.get(controlName)?.markAsTouched();
    });
  }

  setArrayControl<T>(
    control: FormControl<T[] | null>,
    value: T[] | readonly T[] | null,
  ) {
    control.setValue(value ? [...value] : value);
  }
}

export class PokemonFormGroup extends FormGroup<{
  pokemon: FormControl<Pokemon>;
  shiny: FormControl<boolean | null>;
  z: FormControl<string[] | null>;
  dmax: FormControl<boolean | null>;
  tera: FormControl<string[] | null>;
  formes: FormControl<Pokemon[] | null>;
  nickname: FormControl<string | null>;
  moves: FormControl<string[] | null>;
  abilities: FormControl<string[] | null>;
}> {
  constructor(pokemon: Pokemon, pokemonList: BehaviorSubject<Pokemon[]>) {
    super({
      pokemon: new FormControl<Pokemon>(pokemon, {
        nonNullable: true,
        validators: [pokemonValidator(pokemonList)],
      }),
      shiny: new FormControl<boolean | null>(false),
      z: new FormControl<string[] | null>(null),
      dmax: new FormControl<boolean | null>(false),
      tera: new FormControl<string[] | null>(null),
      formes: new FormControl<Pokemon[] | null>([]),
      nickname: new FormControl<string | null>(''),
      moves: new FormControl<string[] | null>([]),
      abilities: new FormControl<string[] | null>([]),
    });

    this.controls.pokemon.updateValueAndValidity();
  }
}

function pokemonValidator(
  pokemonList$: BehaviorSubject<Pokemon[]>,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const pokemon = control.value;
    if (!pokemon || !pokemon.id) return { invalidPokemon: true };
    const pokemonList = pokemonList$.getValue();
    const exists = pokemonList.some((p) => p.id === pokemon.id);
    return exists ? null : { invalidPokemon: true };
  };
}
