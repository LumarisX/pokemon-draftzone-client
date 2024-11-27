import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeraType, TYPES } from '../data';
import { getPidByName, nameList } from '../data/namedex';
import { SpriteComponent } from '../images/sprite.component';
import { TrashSVG } from '../images/svg-components/trash.component';
import { Pokemon } from '../interfaces/draft';
import { SelectSearchComponent } from '../util/dropdowns/select/select-search.component';

@Component({
  selector: 'pokemon-form',
  standalone: true,
  templateUrl: './pokemon-form.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    ReactiveFormsModule,
    TrashSVG,
    SelectSearchComponent,
  ],
})
export class PokemonFormComponent implements OnInit {
  @Input() pokemonForm!: FormGroup;
  @Input() formIndex!: number;
  @Output() deletePokemonEvent = new EventEmitter<number>();
  @Output() addPokemonEvent = new EventEmitter<Pokemon>();
  @Input() bg: string = 'page';

  pokemon: Pokemon = { name: '', id: '' };
  names = nameList();

  teraTypes = PokemonFormComponent.teraTypes;

  static teraTypes: TeraType[] = [...TYPES, 'Stellar'];

  constructor() {}

  ngOnInit(): void {
    this.pokemon = this.pokemonForm.get('pokemonName')?.value;
  }

  static addPokemonForm(
    pokemonData: Pokemon = {
      id: '',
      shiny: false,
      name: '',
    }
  ): FormGroup {
    const teraFormGroup = new FormGroup({});
    this.teraTypes.forEach((option) => {
      teraFormGroup.addControl(
        option,
        new FormControl(!!pokemonData.capt?.tera?.includes(option))
      );
    });

    const group = new FormGroup({
      name: new FormControl(pokemonData.name, Validators.required),
      id: new FormControl(pokemonData.id, Validators.required),
      shiny: new FormControl(pokemonData.shiny),
      captCheck: new FormControl(!!('capt' in pokemonData)),
      capt: new FormGroup({
        teraCheck: new FormControl(
          !!(!('capt' in pokemonData) || 'tera' in pokemonData.capt!)
        ),
        tera: teraFormGroup,
        z: new FormControl(!!pokemonData.capt?.z),
      }),
    });

    group.get('name')?.valueChanges.subscribe((name) => {
      if (name) {
        const id = getPidByName(name);
        if (group.get('id')?.value !== id) {
          group.patchValue({ id: id });
        }
      }
    });

    return group;
  }

  resultSelected(result: Pokemon | null) {
    if (result) {
      this.pokemonForm.patchValue({ name: result.name, id: result.id });
    } else {
      this.pokemonForm.patchValue({ name: null, id: null });
    }
  }

  allTera() {
    Object.values(
      (this.pokemonForm.get('capt.tera') as FormGroup).controls
    ).forEach((control) => control.setValue(true));
  }

  toggleTeraType(type: string) {
    const control = this.pokemonForm.get(`capt.tera.${type}`);
    if (control) {
      control.setValue(!control.value);
    }
  }
}
