import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../../images/sprite.component';
import { ImportSVG } from '../../../images/svg-components/import.component';
import { Pokemon } from '../../../interfaces/draft';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { getPidByName } from '../../../../assets/data/namedex';

@Component({
  selector: 'opponent-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    PokemonFormComponent,
    ImportSVG,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-form-core.component.html',
})
export class OpponentFormCoreComponent implements OnInit {
  @Input() opponentForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  constructor() {}

  get teamArray(): FormArray {
    return this.opponentForm?.get('team') as FormArray;
  }

  set teamArray(array: FormArray) {
    this.opponentForm?.get('team')?.setValue(array);
  }

  ngOnInit(): void {
    this.opponentForm.setValidators(this.validateDraftForm);
  }

  addNewPokemon(index: number, pokemonData: Pokemon = { id: '', name: '' }) {
    this.teamArray?.insert(
      index,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  deletePokemon(index: number) {
    this.teamArray?.removeAt(index);
  }

  validateDraftForm(control: AbstractControl) {
    const formGroup = control as FormGroup;
    const teamArray = formGroup.get('team') as FormArray;
    if (teamArray.length === 0) {
      return { noTeams: true };
    }
    return null;
  }

  onSubmit() {
    if (this.opponentForm.valid) {
      this.formSubmitted.emit(this.opponentForm.value);
    } else {
      console.log('Form is invalid.');
    }
  }

  importPokemon(data: string) {
    this.teamArray.clear();
    data
      .split(/\n|,/)
      .map((string) => string.trim())
      .forEach((name) => {
        this.addNewPokemon(this.teamArray.length, {
          id: getPidByName(name) ?? '',
          name: name,
        });
      });
    this.importing = false;
  }
}
