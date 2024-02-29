import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../api/data.service';
import { Pokemon } from '../../../interfaces/draft';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoreModule } from '../../../sprite/sprite.module';

@Component({
  selector: 'opponent-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-form-core.component.html',
})
export class OpponentFormCoreComponent implements OnInit {
  @Input() opponentForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  constructor() {}

  get teamArray(): FormArray {
    return this.opponentForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.opponentForm.setValidators(this.validateDraftForm);
  }

  addNewPokemon(
    index: number = this.teamArray.length,
    pokemonData: Pokemon = { pid: '', name: '' }
  ) {
    this.teamArray?.insert(
      index + 1,
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
}
