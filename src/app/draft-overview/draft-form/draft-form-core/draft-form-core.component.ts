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
import { SpriteComponent } from '../../../images/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { getPidByName } from '../../../pokemon';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { ImportSVG } from '../../../images/svg-components/import.component';

@Component({
  selector: 'draft-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    PokemonFormComponent,
    ImportSVG,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form-core.component.html',
})
export class DraftFormCoreComponent implements OnInit {
  formats = [];
  rulesets = [];
  @Input() draftForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  constructor(private dataService: DataService) {}

  get teamArray(): FormArray {
    return this.draftForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = <any>formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = <any>rulesets;
    });
    this.draftForm.setValidators(this.validateDraftForm);
  }

  addNewPokemon(
    index: number = this.teamArray.length,
    pokemonData: Pokemon = { id: '', name: '' }
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
    if (this.draftForm.valid) {
      this.formSubmitted.emit(this.draftForm.value);
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
