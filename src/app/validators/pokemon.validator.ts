import { AbstractControl, ValidatorFn } from "@angular/forms";
import { BattlePokedex } from "../pokedex";

export function pokemonNameValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return (!(control.value in BattlePokedex)) ? { 'forbiddenName': { value: control.value } } : null;
  };
}