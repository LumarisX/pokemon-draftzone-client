import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Namedex } from '../data/namedex';

export function pokemonNameValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return !(control.value in Namedex)
      ? { forbiddenName: { value: control.value } }
      : null;
  };
}
