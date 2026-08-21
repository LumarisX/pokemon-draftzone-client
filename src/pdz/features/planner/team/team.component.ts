import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { DraftFormGroup } from '../planner.component';

@Component({
  selector: 'pdz-planner-team',
  styleUrl: './team.component.scss',
  templateUrl: './team.component.html',
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDropList,
    IconComponent,
    PokemonSearchComponent,
    SpriteComponent,
  readonly draftFormGroup = input<DraftFormGroup>();

  get min() {
    return this.draftFormGroup()?.controls.min.value ?? 0;
  }

  get remainingPokemon() {
    const tiered =
      this.draftFormGroup()?.controls.team?.value.filter(
        (form) => form.pokemon?.id && form.pokemon.id != '',
      ).length || 0;
    const mons = this.min - tiered;
    return mons > 1 ? mons : 1;
  }

  get isPoints() {
    const draftFormGroup = this.draftFormGroup();
    return (
      !draftFormGroup || draftFormGroup?.controls.system.value === 'points'
=======
  @Input() draftFormGroup?: DraftFormGroup;

  readonly systemOptions = [
    { id: 'points', label: 'Points' },
    { id: 'tiers', label: 'Tiers' },
  ];

  get teamControls() {
    return this.draftFormGroup?.controls.team.controls ?? [];
  }

  get min(): number {
    return this.draftFormGroup?.controls.min.value ?? 0;
  }

  get isPoints(): boolean {
    return (
      !this.draftFormGroup ||
      this.draftFormGroup.controls.system.value === 'points'
>>>>>>> planner-update
    );
  }

  takenIdsFor(index: number): (string | undefined)[] {
    return this.teamControls
      .filter((_, position) => position !== index)
      .map((control) => control.controls.pokemon.value?.id);
  }

  get remainingPokemon(): number {
    const tiered = this.teamControls.filter(
      (control) => control.controls.pokemon.value?.id,
    ).length;
    return Math.max(this.min - tiered, 1);
  }

  get remainingPoints(): number {
    const totalUsed = this.teamControls.reduce(
      (sum, control) => sum + (control.controls.value.value ?? 0),
      0,
    );
    return (this.draftFormGroup?.controls.totalPoints.value ?? 0) - totalUsed;
  }

  toggle(control: FormControl<boolean>): void {
    control.setValue(!control.value);
  }

  onClear(index: number): void {
    const controls = this.teamControls[index].controls;
    controls.tier.setValue('');
    controls.value.setValue(null);
  }

  get clearableCount(): number {
    return this.teamControls.filter(
      (control) =>
        !control.controls.locked.value &&
        (control.controls.pokemon.value ||
          control.controls.value.value !== null ||
          control.controls.tier.value),
    ).length;
  }

  clearTeam(): void {
    if (!this.clearableCount) return;

    this.teamControls.forEach((control) => {
      if (control.controls.locked.value) return;
      control.controls.pokemon.setValue(null);
      control.controls.tier.setValue('');
      control.controls.value.setValue(null);
    });
  }

  drop(event: CdkDragDrop<unknown>): void {
    if (!this.draftFormGroup) return;
    moveItemInArray(
      this.draftFormGroup.controls.team.controls,
      event.previousIndex,
      event.currentIndex,
    );
    this.draftFormGroup.controls.team.updateValueAndValidity();
  }
}
