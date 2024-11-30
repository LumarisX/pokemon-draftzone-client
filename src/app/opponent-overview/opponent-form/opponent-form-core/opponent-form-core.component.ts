import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getPidByName, nameList } from '../../../data/namedex';
import { ImportSVG } from '../../../images/svg-components/import.component';
import { Pokemon } from '../../../interfaces/draft';
import { SelectSearchComponent } from '../../../util/dropdowns/select/select-search.component';
import { PokemonFormComponent } from '../../../util/forms/pokemon-form/pokemon-form.component';

@Component({
  selector: 'opponent-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ImportSVG,
    ReactiveFormsModule,
    SelectSearchComponent,
    PokemonFormComponent,
  ],
  templateUrl: './opponent-form-core.component.html',
})
export class OpponentFormCoreComponent implements OnInit {
  @Input() opponentForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  names = nameList();
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

  @ViewChild(SelectSearchComponent)
  selectSearch!: SelectSearchComponent<Pokemon>;

  addNewPokemon(index: number, pokemonData: Pokemon = { id: '', name: '' }) {
    this.teamArray?.insert(
      index,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
    this.selectSearch.clearSelection();
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
