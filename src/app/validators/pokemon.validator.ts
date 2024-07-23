import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Pokedex } from '../pokedex';

export function pokemonNameValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return !(control.value in Pokedex)
      ? { forbiddenName: { value: control.value } }
      : null;
  };
}
