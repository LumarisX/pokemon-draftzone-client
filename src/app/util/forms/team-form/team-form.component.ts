import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { TeraSVG } from '../../../images/svg-components/tera.component';
import { ZSVG } from '../../../images/svg-components/z.component';
import { Pokemon } from '../../../interfaces/draft';

type DraftPokemonFormGroup = {
  pokemon: FormControl<Pokemon>;
  shiny: FormControl<boolean | null>;
  z: FormControl<boolean | null>;
  dmax: FormControl<boolean | null>;
  tera: FormControl<boolean | null>;
  formes: FormControl<Pokemon[] | null>;
  nickname: FormControl<string | null>;
  moves: FormControl<string[] | null>;
  abilities: FormControl<string[] | null>;
};

@Component({
  selector: 'new-team-form',
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
    MatAutocompleteModule,
    CdkAccordionModule,
    SpriteComponent,
    TeraSVG,
    ZSVG,
  ],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
})
export class NewTeamFormComponent implements OnInit {
  importing: boolean = false;
  readonly separatorKeyCodes: number[] = [ENTER, COMMA];
  teamArray!: FormArray<FormGroup<DraftPokemonFormGroup>>;

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
      this.team.map(
        (mon) =>
          new FormGroup<DraftPokemonFormGroup>({
            pokemon: new FormControl(mon, { nonNullable: true }),
            shiny: new FormControl<boolean | null>(false),
            z: new FormControl<boolean | null>(false),
            dmax: new FormControl<boolean | null>(false),
            tera: new FormControl<boolean | null>(false),
            formes: new FormControl<Pokemon[] | null>([]),
            nickname: new FormControl<string | null>(''),
            moves: new FormControl<string[] | null>([]),
            abilities: new FormControl<string[] | null>([]),
          }),
      ),
    );
  }

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
}
