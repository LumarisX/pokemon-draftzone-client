import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Pokemon } from '../interfaces/draft';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';

@Component({
  selector: 'pokemon-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './pokemon-form.component.html',
})
export class PokemonFormComponent {
  @Input() pokemonForm!: FormGroup;
  @Input() formIndex!: number;
  @Output() deletePokemonEvent = new EventEmitter<number>();
  @Output() addPokemonEvent = new EventEmitter<Pokemon>();

  constructor(private fb: FormBuilder) {}

  static addPokemonForm(
    pokemonData: Pokemon = { pid: '', shiny: false, capt: {} }
  ): FormGroup {
    return new FormGroup({
      pokemonName: new FormControl(pokemonData.pid),
      shiny: new FormControl(pokemonData.shiny),
      capt: new FormControl(pokemonData.capt),
    });
  }

  filter(input: string) {}
}
