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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { TERATYPES, TYPES } from '../../../data';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { PokemonSelectComponent } from '../../pokemon-select/pokemon-select.component';
import { MatRippleModule } from '@angular/material/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatRippleModule,
    CdkAccordionModule,
    SpriteComponent,
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
  importing: boolean = false;
  readonly separatorKeyCodes: number[] = [ENTER, COMMA];
  teamArray!: FormArray<PokemonFormGroup>;

  @Input() ruleset!: string | null;

  constructor(private fb: FormBuilder) {}

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

  formeOptions: Pokemon[] = [
    { id: 'miniormeteor', name: 'Minior-Meteor' },
    { id: 'deoxysdefense', name: 'Deoxys-Defense' },
    { id: 'deoxys', name: 'Deoxys' },
    { id: 'deoxysspeed', name: 'Deoxys-Speed' },
  ];

  ngOnInit(): void {
    this.teamArray = this.fb.array(
      this.team.map((mon) => new PokemonFormGroup(mon)),
    );
  }
  readonly teraTypes = TERATYPES;
  readonly zTypes = TYPES;
  readonly keywords = signal<string[]>([]);

  removeKeyword(keyword: string) {
    this.keywords.update((keywords) => {
      const index = keywords.indexOf(keyword);
      if (index < 0) return keywords;
      keywords.splice(index, 1);
      return [...keywords];
    });
  }

  add(event: MatChipInputEvent) {
    const value = event.value;
    if (value) {
      this.keywords.update((keywords) => [...keywords, value]);
    }
    event.chipInput.clear();
  }

  selected(event: MatAutocompleteSelectedEvent) {
    this.keywords.update((keywords) => [...keywords, event.option.viewValue]);
  }

  deletePokemon(index: number) {
    this.teamArray.removeAt(index);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.teamArray)
      moveItemInArray(
        this.teamArray.controls,
        event.previousIndex,
        event.currentIndex,
      );
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

  addAllTeras(control: FormControl<string[] | null>) {
    control.setValue([...this.teraTypes]);
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
