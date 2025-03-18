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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
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
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TERATYPES, TYPES } from '../../../data';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { PokemonSelectComponent } from '../../pokemon-select/pokemon-select.component';
import { SlideToggleComponent } from '../../inputs/slide-toggle/slide-toggle.component';
import { filter, Subject, takeUntil } from 'rxjs';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatDividerModule,
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
  importing: boolean = true;
  teamOption: boolean = false;
  readonly separatorKeyCodes: number[] = [ENTER, COMMA];
  teamArray!: FormArray<PokemonFormGroup>;
  @Input() ruleset!: string | null;

  constructor(private fb: FormBuilder) {}

  checked: boolean = false;
  team: Pokemon[] = [
    {
      id: 'deoxysattack',
      name: 'Deoxys-Attack',
    },
    {
      id: 'clefable',
      name: 'Clefable',
    },
    {
      id: 'minior',
      name: 'Minior',
    },
  ];

  formeFilter = new FormControl<string>('');

  formeOptions: Pokemon[] = [
    { id: 'miniormeteor', name: 'Minior-Meteor' },
    { id: 'deoxysdefense', name: 'Deoxys-Defense' },
    { id: 'deoxys', name: 'Deoxys' },
    { id: 'deoxysspeed', name: 'Deoxys-Speed' },
  ];

  filteredFormeOptions: Pokemon[] = [
    { id: 'miniormeteor', name: 'Minior-Meteor' },
    { id: 'deoxysdefense', name: 'Deoxys-Defense' },
    { id: 'deoxys', name: 'Deoxys' },
    { id: 'deoxysspeed', name: 'Deoxys-Speed' },
  ];

  destroy$ = new Subject<void>();
  ngOnInit(): void {
    this.teamArray = this.fb.array(
      this.team.map((mon) => new PokemonFormGroup(mon)),
    );

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
  readonly teraTypes = TERATYPES;
  readonly zTypes = TYPES;
  readonly keywords = signal<string[]>([]);

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
    if (this.teamArray)
      moveItemInArray(
        this.teamArray.controls,
        event.previousIndex,
        event.currentIndex,
      );
  }

  importPokemon(event: MatChipInputEvent) {
    event.chipInput.clear();
  }

  addPokemon(pokemon: Pokemon | null) {
    if (
      pokemon &&
      this.teamArray.controls.every(
        (pControl) => pControl.value.pokemon?.id !== pokemon.id,
      )
    )
      this.teamArray.push(new PokemonFormGroup(pokemon));
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
    const lowerCaseSearch = searchText.toLowerCase().replace(/[-'.\s]/, '');
    this.filteredFormeOptions = this.formeOptions.filter((forme) =>
      forme.name
        .toLowerCase()
        .replace(/[-'.\s]/, '')
        .includes(lowerCaseSearch),
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
      console.log(control.controls.pokemon.value, valid);
      return valid;
    });
  }

  checkTeraPartial() {
    return this.teamArray.controls.some((control) => {
      let valid =
        control.controls.tera.value && control.controls.tera.value.length > 0;
      console.log(control.controls.pokemon.value, valid);
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

class PokemonFormGroup extends FormGroup<{
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
  constructor(pokemon: Pokemon) {
    super({
      pokemon: new FormControl(pokemon, { nonNullable: true }),
      shiny: new FormControl<boolean | null>(false),
      z: new FormControl<string[] | null>(['Flying', 'Grass', 'Dark']),
      dmax: new FormControl<boolean | null>(false),
      tera: new FormControl<string[] | null>(['Fire', 'Ground', 'Steel']),
      formes: new FormControl<Pokemon[] | null>([]),
      nickname: new FormControl<string | null>(''),
      moves: new FormControl<string[] | null>([]),
      abilities: new FormControl<string[] | null>([]),
    });
  }
}
