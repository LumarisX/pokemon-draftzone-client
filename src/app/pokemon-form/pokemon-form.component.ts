import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../api/data.service';
import { Pokemon } from '../interfaces/draft';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { FilterComponent } from '../filter/filter.component';

@Component({
  selector: 'pokemon-form',
  standalone: true,
  templateUrl: './pokemon-form.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CoreModule,
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
      capt: { tera: [], z: false },
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
      captCheck: new FormControl(false),
      capt: new FormGroup({
        teraCheck: new FormControl(false),
        tera: teraFormGroup,
        z: new FormControl(''),
      }),
    });
  }

  resultSelected($event: Pokemon) {
    console.log($event);
    this.pokemonForm.patchValue({ name: $event.name, pid: $event.pid });
  }
}
