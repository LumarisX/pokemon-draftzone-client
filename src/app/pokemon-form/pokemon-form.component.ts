import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FilterComponent } from '../filter/filter.component';
import { Pokemon } from '../interfaces/draft';
import { SpriteComponent } from '../images/sprite.component';

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
    FilterComponent,
  ],
})
export class PokemonFormComponent implements OnInit {
  @Input() pokemonForm!: FormGroup;
  @Input() formIndex!: number;
  @Output() deletePokemonEvent = new EventEmitter<number>();
  @Output() addPokemonEvent = new EventEmitter<Pokemon>();

  pokemon: Pokemon = { name: '', pid: '' };

  teraTypes = [
    'Normal',
    'Grass',
    'Water',
    'Fire',
    'Electric',
    'Ground',
    'Rock',
    'Flying',
    'Ice',
    'Fighting',
    'Poison',
    'Bug',
    'Psychic',
    'Dark',
    'Ghost',
    'Dragon',
    'Steel',
    'Fairy',
    'Stellar',
  ];

  static teraTypes = [
    'Normal',
    'Grass',
    'Water',
    'Fire',
    'Electric',
    'Ground',
    'Rock',
    'Flying',
    'Ice',
    'Fighting',
    'Poison',
    'Bug',
    'Psychic',
    'Dark',
    'Ghost',
    'Dragon',
    'Steel',
    'Fairy',
    'Stellar',
  ];

  constructor() {}

  ngOnInit(): void {
    this.pokemon = this.pokemonForm.get('pokemonName')?.value;
  }

  static addPokemonForm(
    pokemonData: Pokemon = {
      pid: '',
      shiny: false,
      name: '',
    }
  ): FormGroup {
    const teraFormGroup = new FormGroup({});
    this.teraTypes.forEach((option) => {
      teraFormGroup.addControl(
        option,
        new FormControl(pokemonData.capt?.tera?.includes(option))
      );
    });

    return new FormGroup({
      name: new FormControl(pokemonData.name),
      pid: new FormControl(pokemonData.pid),
      shiny: new FormControl(pokemonData.shiny),
      captCheck: new FormControl('capt' in pokemonData),
      capt: new FormGroup({
        teraCheck: new FormControl(
          'capt' in pokemonData && 'tera' in pokemonData.capt!
        ),
        tera: teraFormGroup,
        z: new FormControl(''),
      }),
    });
  }

  resultSelected($event: Pokemon) {
    this.pokemonForm.patchValue({ name: $event.name, pid: $event.pid });
  }
}
