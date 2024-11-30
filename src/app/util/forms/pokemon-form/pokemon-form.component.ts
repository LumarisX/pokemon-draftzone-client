import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  input,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeraType, TYPES } from '../../../data';
import { getPidByName, nameList } from '../../../data/namedex';
import { SpriteComponent } from '../../../images/sprite.component';
import { BadgeSVG } from '../../../images/svg-components/badge.component';
import { CircleSVG } from '../../../images/svg-components/circle.component';
import { ShinySVG } from '../../../images/svg-components/shiny.component';
import { XMarkSVG } from '../../../images/svg-components/xmark.component';
import { Pokemon } from '../../../interfaces/draft';
import { SelectSearchComponent } from '../../dropdowns/select/select-search.component';

@Component({
  selector: 'pokemon-form',
  standalone: true,
  templateUrl: './pokemon-form.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    ReactiveFormsModule,
    SelectSearchComponent,
    ShinySVG,
    BadgeSVG,
    CircleSVG,
    XMarkSVG,
  ],
})
export class PokemonFormComponent implements OnInit {
  @Input() pokemonForm!: FormGroup;
  @Input() formIndex!: number;
  @Output() deletePokemonEvent = new EventEmitter<number>();
  @Output() addPokemonEvent = new EventEmitter<Pokemon>();
  @Input() color: string = 'page';
  @Input() colorValue: number | undefined;

  @Input() class: string = '';

  pokemon: Pokemon = { name: '', id: '' };
  names = nameList();

  set allTeras(value: boolean) {
    Object.values(
      (this.pokemonForm.get('capt.tera') as FormGroup).controls,
    ).forEach((control) => control.setValue(value));
  }

  get allTeras() {
    return !Object.values(
      (this.pokemonForm.get('capt.tera') as FormGroup).controls,
    ).find((control) => control.value === false);
  }

  teraTypes = PokemonFormComponent.teraTypes;

  static teraTypes: TeraType[] = [...TYPES, 'Stellar'];

  constructor() {}

  ngOnInit(): void {
    this.pokemon = this.pokemonForm.get('pokemonName')?.value;
  }

  static addPokemonForm(
    pokemonData: Pokemon = {
      id: '',
      shiny: false,
      name: '',
    },
  ): FormGroup {
    const teraFormGroup = new FormGroup({});
    this.teraTypes.forEach((option) => {
      teraFormGroup.addControl(
        option,
        new FormControl(!!pokemonData.capt?.tera?.includes(option)),
      );
    });

    const group = new FormGroup({
      name: new FormControl(pokemonData.name, Validators.required),
      id: new FormControl(pokemonData.id, Validators.required),
      shiny: new FormControl(pokemonData.shiny),
      captCheck: new FormControl(!!('capt' in pokemonData)),
      capt: new FormGroup({
        teraCheck: new FormControl(
          !!(!('capt' in pokemonData) || 'tera' in pokemonData.capt!),
        ),
        tera: teraFormGroup,
        z: new FormControl(!!pokemonData.capt?.z),
      }),
    });

    group.get('name')?.valueChanges.subscribe((name) => {
      if (name) {
        const id = getPidByName(name);
        if (group.get('id')?.value !== id) {
          group.patchValue({ id: id });
        }
      }
    });

    return group;
  }

  resultSelected(result: Pokemon | null) {
    if (result) {
      this.pokemonForm.patchValue({ name: result.name, id: result.id });
    } else {
      this.pokemonForm.patchValue({ name: null, id: null });
    }
  }

  toggleTeraType(type: string) {
    const control = this.pokemonForm.get(`capt.tera.${type}`);
    control?.setValue(!control.value);
  }

  toggleControl(controlName: string) {
    const control = this.pokemonForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }
}
