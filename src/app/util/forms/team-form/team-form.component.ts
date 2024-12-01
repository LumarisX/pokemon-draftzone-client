import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  input,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getPidByName, nameList } from '../../../data/namedex';
import { Pokemon } from '../../../interfaces/draft';
import { SelectSearchComponent } from '../../dropdowns/select/select-search.component';
import { PokemonFormComponent } from '../pokemon-form/pokemon-form.component';

@Component({
  selector: 'team-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PokemonFormComponent,
    ReactiveFormsModule,
    SelectSearchComponent,
  ],
  templateUrl: './team-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TeamFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TeamFormComponent),
      multi: true,
    },
  ],
})
export class TeamFormComponent implements ControlValueAccessor, OnInit {
  @Input() color: string = 'menu';
  @Input() maxCols: number = 1;
  @Input() extraClass: string = '';

  importing: boolean = false;
  constructor() {}
  names = nameList();

  _teamArray!: FormArray<FormGroup>;

  set teamArray(pokemons: Pokemon[]) {
    this._teamArray = new FormArray(
      pokemons.map((pokemon) => PokemonFormComponent.addPokemonForm(pokemon)),
    );
  }

  get teamArray(): FormArray<FormGroup> {
    return this._teamArray;
  }

  ngOnInit(): void {
    this.teamArray = [];
  }

  @ViewChild(SelectSearchComponent)
  selectSearch?: SelectSearchComponent<Pokemon>;

  addNewPokemon(pokemonData: Pokemon | null | undefined) {
    if (!pokemonData) return;
    this.teamArray.push(PokemonFormComponent.addPokemonForm(pokemonData));
    this.selectSearch?.clearSelection();
  }

  deletePokemon(index: number): void {
    this.teamArray.removeAt(index);
  }

  importPokemon(data: string) {
    this.teamArray.clear();
    data
      .split(/\n|,/)
      .map((string) => string.trim())
      .forEach((name) => {
        this.addNewPokemon({
          id: getPidByName(name) ?? '',
          name: name,
        });
      });
    this.importing = false;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.teamArray.valid) {
      return null;
    }
    return {
      invalidForm: { valid: false, message: 'Team fields are invalid' },
    };
  }

  private onTouched: () => void = () => {};
  isDisabled = false;

  writeValue(value: Pokemon[] | null): void {
    if (value) {
      this.teamArray.clear();
      value.forEach((pokemon) =>
        this.teamArray.push(PokemonFormComponent.addPokemonForm(pokemon)),
      );
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.teamArray.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.teamArray?.controls.forEach((control) =>
      isDisabled ? control.disable() : control.enable(),
    );
  }
}
