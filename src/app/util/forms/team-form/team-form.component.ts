import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { TERATYPES, TYPES } from '../../../data';
import { getPidByName } from '../../../data/namedex';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { SlideToggleComponent } from '../../inputs/slide-toggle/slide-toggle.component';
import { PokemonSelectComponent } from '../../pokemon-select/pokemon-select.component';

@Component({
  selector: 'team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatRippleModule,
    CdkAccordionModule,
    SpriteComponent,
    SlideToggleComponent,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    CdkDragPreview,
    PokemonSelectComponent,
  ],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  animations: [
    trigger('rotateIcon', [
      state('expanded', style({ transform: 'rotate(180deg)' })),
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      transition('collapsed => expanded', animate('500ms ease-in-out')),
      transition('expanded => collapsed', animate('500ms ease-in-out')),
    ]),
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
      ),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [animate('500ms ease-in-out')]),
    ]),
  ],
})
export class TeamFormComponent {
  private dataService = inject(DataService);

  @Input()
  ruleset!: string;
  @Input()
  teamArray!: FormArray<PokemonFormGroup>;
  @Input()
  pokemonList$!: BehaviorSubject<Pokemon[]>;

  readonly teraTypes = TERATYPES;
  readonly zTypes = TYPES;
  importing = false;
  importInput = '';
  teamOption = false;
  checked = false;

  removeChip(control: FormControl<any[] | null>, index: number) {
    if (!control.value) return;
    const updatedMoves = [...control.value];
    updatedMoves.splice(index, 1);
    control.setValue(updatedMoves);
  }

  addChip(control: FormControl<string[] | null>, event: MatChipInputEvent) {
    const value = event.value.trim();
    if (value) {
      control.setValue([...(control.value ?? []), value]);
    }
    event.chipInput.clear();
  }

  selectedChip<T>(
    control: FormControl<T[] | null>,
    event: MatAutocompleteSelectedEvent,
  ) {
    const value: T = event.option.value;
    control.setValue(control.value ? [...control.value, value] : [value]);
  }

  isSelected(
    group: FormControl<Pokemon[] | null>,
    formeOption: Pokemon,
  ): boolean {
    return !!group.value?.some((f: any) => f.name === formeOption.name);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.teamArray.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  handlePokemonInput(event?: Event): void {
    event?.preventDefault();
    this.importPokemon();
  }

  importPokemon() {
    const pokemonNames = this.importInput
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    pokemonNames.forEach((name) => {
      this.teamArray.push(
        new PokemonFormGroup(
          { id: getPidByName(name), name },
          this.pokemonList$,
        ),
      );
    });
    this.importInput = '';
  }

  addPokemon(pokemon: Pokemon | null) {
    if (
      pokemon &&
      this.teamArray.controls.every(
        (pControl) => pControl.value.pokemon?.id !== pokemon.id,
      )
    ) {
      this.teamArray.push(new PokemonFormGroup(pokemon, this.pokemonList$));
    }
  }

  deletePokemon(index: number) {
    this.teamArray.removeAt(index);
  }

  addAllTypes(control: FormControl<string[] | null>, types: readonly string[]) {
    control.setValue([...types]);
  }

  toggleType(
    control: FormControl<string[] | null>,
    type: string,
    remove: boolean = true,
  ) {
    if (remove) {
      if (!control.value) return;
      control.setValue(control.value.filter((t) => t !== type));
    } else {
      if (control.value?.includes(type)) return;
      control.setValue([...(control.value || []), type]);
    }
  }

  displayFn(forme?: any): string {
    return forme ? forme.name : '';
  }

  validControl(
    control: AbstractControl<any[] | string | boolean | null> | null,
  ): boolean {
    const value = control?.value;
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value;
  }

  checkPartial(controlName: string) {
    return this.teamArray.controls.some((control) => {
      let valid = this.validControl(control.get(controlName));
      return valid;
    });
  }

  checkTeraPartial() {
    return this.teamArray.controls.some((control) => {
      let valid =
        control.controls.tera.value && control.controls.tera.value.length > 0;
      return valid;
    });
  }

  isAllSelected(controlName: string): boolean {
    return this.teamArray.controls.every((group) => {
      const value = group.get(controlName)?.value;
      if (Array.isArray(value)) return value.length;
      return value;
    });
  }

  partialSelected(controlName: string): boolean {
    const hasSelected = this.teamArray.controls.some((group) => {
      const value = group.get(controlName)?.value;
      if (Array.isArray(value)) return value.length;
      return value;
    });
    const isNotAll = !this.isAllSelected(controlName);
    return hasSelected && isNotAll;
  }

  toggleTeamControl(controlName: string, isChecked: boolean): void {
    this.teamArray.controls.forEach((group) => {
      group.get(controlName)?.setValue(isChecked ? [...this.teraTypes] : null);
      group.get(controlName)?.markAsTouched();
    });
  }

  setArrayControl<T>(
    control: FormControl<T[] | null>,
    value: T[] | readonly T[] | null,
  ) {
    control.setValue(value ? [...value] : value);
  }

  onTabChange(group: PokemonFormGroup, tabIndex: MatTabChangeEvent) {
    switch (tabIndex.index) {
      case 2:
        this.checkFormes(group);
        break;
    }
  }

  checkFormes(group: PokemonFormGroup) {
    if (group.formeList === undefined) {
      this.dataService
        .getFormes(this.ruleset, group.controls.pokemon.value.id)
        .subscribe((formes) => {
          group.formeList = formes;
        });
    }
  }
}

export class PokemonFormGroup extends FormGroup<{
  pokemon: FormControl<Pokemon>;
  shiny: FormControl<boolean | null>;
  nickname: FormControl<string>;
  tera: FormControl<string[] | null>;
  z: FormControl<string[] | null>;
  dmax: FormControl<boolean | null>;
  formes: FormControl<Pokemon[]>;
  moves: FormControl<string[]>;
  abilities: FormControl<string[]>;
}> {
  formeList?: Pokemon[];
  constructor(pokemon: Pokemon, pokemonList: BehaviorSubject<Pokemon[]>) {
    super({
      pokemon: new FormControl<Pokemon>(pokemon, {
        nonNullable: true,
        validators: [pokemonValidator(pokemonList)],
      }),
      shiny: new FormControl<boolean | null>(!!pokemon.shiny),
      nickname: new FormControl<string>('', {
        nonNullable: true,
      }),
      tera: new FormControl<string[] | null>(pokemon.capt?.tera ?? null),
      z: new FormControl<string[] | null>(pokemon.capt?.z ?? null),
      dmax: new FormControl<boolean | null>(false),
      formes: new FormControl<Pokemon[]>(pokemon.draftFormes ?? [], {
        nonNullable: true,
      }),
      moves: new FormControl<string[]>(pokemon.modifiers?.moves ?? [], {
        nonNullable: true,
      }),
      abilities: new FormControl<string[]>(pokemon.modifiers?.abilities ?? [], {
        nonNullable: true,
      }),
    });
    this.controls.pokemon.updateValueAndValidity();
  }

  toPokemon(): Pokemon {
    const capt = {
      tera: this.controls.tera.value?.length
        ? this.controls.tera.value
        : undefined,
      z: this.controls.z.value?.length ? this.controls.z.value : undefined,
      dmax: this.controls.dmax.value || undefined,
    };

    const modifiers = {
      moves: this.controls.moves.value?.length
        ? this.controls.moves.value
        : undefined,
      abilities: this.controls.abilities.value?.length
        ? this.controls.abilities.value
        : undefined,
    };

    return {
      id: this.controls.pokemon.value.id,
      name: this.controls.pokemon.value.name,
      shiny: this.controls.shiny.value || undefined,
      nickname: this.controls.nickname.value || undefined,
      draftFormes: this.controls.formes.value?.length
        ? this.controls.formes.value
        : undefined,
      modifiers: Object.values(modifiers).some(Boolean) ? modifiers : undefined,
      capt: Object.values(capt).some(Boolean) ? capt : undefined,
    };
  }
}

function pokemonValidator(
  pokemonList$: BehaviorSubject<Pokemon[]>,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const pokemon = control.value;
    if (!pokemon || !pokemon.id) return { invalidPokemon: true };
    const pokemonList = pokemonList$.getValue();
    const exists = pokemonList.some((p) => p.id === pokemon.id);
    return exists ? null : { invalidPokemon: true };
  };
}
