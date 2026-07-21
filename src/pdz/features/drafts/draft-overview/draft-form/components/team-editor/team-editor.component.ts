import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { TERATYPES, TYPES } from '@pdz/shared/data';
import { getPidByName } from '@pdz/shared/data/namedex';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { DataService } from '@pdz/core/services/data.service';
import { PokemonFormGroup } from '@pdz/shared/forms/team-form/team-form.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { ChipInputComponent } from '../chip-input/chip-input.component';
import { PokemonSearchComponent } from '../pokemon-search/pokemon-search.component';

type CaptKind = 'tera' | 'z' | 'dmax';

@Component({
  selector: 'pdz-team-editor',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    IconComponent,
    SpriteComponent,
    ChipInputComponent,
    PokemonSearchComponent,
  ],
  templateUrl: './team-editor.component.html',
  styleUrl: './team-editor.component.scss',
})
export class TeamEditorComponent {
  private dataService = inject(DataService);

  @Input({ required: true }) ruleset!: string;
  @Input({ required: true }) teamArray!: FormArray<PokemonFormGroup>;
  @Input({ required: true }) pokemonList$!: BehaviorSubject<DraftPokemon[]>;

  @Output() isImporting = new EventEmitter<boolean>();

  readonly teraTypes = TERATYPES;
  readonly zTypes = TYPES;

  importing = false;
  importInput = '';
  expanded = new Set<PokemonFormGroup>();

  get takenIds(): (string | null | undefined)[] {
    return this.teamArray.controls.map(
      (group) => group.controls.pokemon.value?.id,
    );
  }

  isExpanded(group: PokemonFormGroup): boolean {
    return this.expanded.has(group);
  }

  toggleExpand(group: PokemonFormGroup): void {
    if (this.expanded.has(group)) {
      this.expanded.delete(group);
    } else {
      this.expanded.add(group);
      this.checkFormes(group);
    }
  }

  addPokemon(pokemon: DraftPokemon): void {
    const alreadyAdded = this.teamArray.controls.some(
      (control) => control.controls.pokemon.value?.id === pokemon.id,
    );
    if (alreadyAdded) return;
    const newGroup = new PokemonFormGroup(pokemon, this.pokemonList$);
    this.teamArray.push(newGroup);
    newGroup.controls.pokemon.updateValueAndValidity();
  }

  deletePokemon(index: number): void {
    this.expanded.delete(this.teamArray.controls[index]);
    this.teamArray.removeAt(index);
  }

  drop(event: CdkDragDrop<PokemonFormGroup[]>): void {
    moveItemInArray(
      this.teamArray.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  toggleImporting(setting?: boolean): void {
    this.importing = setting ?? !this.importing;
    if (!this.importing) this.importInput = '';
    this.isImporting.emit(this.importing);
  }

  confirmImport(): void {
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
    this.toggleImporting(false);
  }

  checkFormes(group: PokemonFormGroup): void {
    if (group.formeList === undefined && group.controls.pokemon.value?.id) {
      this.dataService
        .getFormes(this.ruleset, group.controls.pokemon.value.id)
        .subscribe((formes) => {
          group.formeList = formes;
        });
    }
  }

  isFormeSelected(group: PokemonFormGroup, forme: DraftPokemon): boolean {
    return group.controls.formes.value.some((f) => f.id === forme.id);
  }

  toggleForme(group: PokemonFormGroup, forme: DraftPokemon): void {
    const selected = group.controls.formes.value;
    group.controls.formes.setValue(
      this.isFormeSelected(group, forme)
        ? selected.filter((f) => f.id !== forme.id)
        : [...selected, forme],
    );
  }

  toggleCapt(
    control: FormControl<string[] | null>,
    types: readonly string[],
  ): void {
    control.setValue(control.value ? null : [...types]);
  }

  toggleType(control: FormControl<string[] | null>, type: string): void {
    const value = control.value ?? [];
    control.setValue(
      value.includes(type) ? value.filter((t) => t !== type) : [...value, type],
    );
  }

  setArrayControl(
    control: FormControl<string[] | null>,
    value: readonly string[],
  ): void {
    control.setValue([...value]);
  }

  captState(kind: CaptKind): 'all' | 'some' | 'none' {
    if (!this.teamArray.length) return 'none';
    const isOn = (group: PokemonFormGroup): boolean => {
      if (kind === 'dmax') return !!group.controls.dmax.value;
      const value = group.controls[kind].value;
      return !!value && value.length > 0;
    };
    const onCount = this.teamArray.controls.filter(isOn).length;
    if (onCount === 0) return 'none';
    return onCount === this.teamArray.length ? 'all' : 'some';
  }

  toggleTeamCapt(kind: CaptKind): void {
    const turnOn = this.captState(kind) !== 'all';
    this.teamArray.controls.forEach((group) => {
      if (kind === 'dmax') {
        group.controls.dmax.setValue(turnOn);
      } else if (kind === 'tera') {
        group.controls.tera.setValue(turnOn ? [...this.teraTypes] : null);
      } else {
        group.controls.z.setValue(turnOn ? [...this.zTypes] : null);
      }
      group.get(kind)?.markAsTouched();
    });
  }

  isInvalid(group: PokemonFormGroup): boolean {
    return group.controls.pokemon.invalid;
  }

  teraIconPath(type: string): string {
    return `assets/icons/tera_types/Tera${type}.png`;
  }

  zIconPath(type: string): string {
    return `assets/icons/z_types/${type}_Z_Crystal.png`;
  }
}
