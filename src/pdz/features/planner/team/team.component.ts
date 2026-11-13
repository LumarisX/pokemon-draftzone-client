import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import {
  PlannerContext,
  PlannerPokemon,
  rosterChanges,
} from '../planner-context';
import { DraftFormGroup, TeamFormGroup } from '../planner.component';

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
    ButtonComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
})
export class PlannerTeamComponent {
  @Input() draftFormGroup?: DraftFormGroup;

  readonly context = input<PlannerContext | null>(null);

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

  get team(): PlannerPokemon[] {
    return this.teamControls
      .map((control) => control.controls.pokemon.value)
      .filter((pokemon): pokemon is PlannerPokemon => !!pokemon?.id);
  }

  get changes(): { added: PlannerPokemon[]; dropped: PlannerPokemon[] } {
    return rosterChanges(this.team, this.context()?.roster ?? []);
  }

  get unmetRequirements(): { tierName: string; have: number; required: number }[] {
    const requirements = this.context()?.tierRequirements ?? [];
    if (!requirements.length) return [];
    const counts = new Map<string, number>();
    for (const control of this.teamControls) {
      if (!control.controls.pokemon.value?.id) continue;
      const tier = control.controls.tier.value;
      counts.set(tier, (counts.get(tier) ?? 0) + 1);
    }
    return requirements
      .map((requirement) => ({
        tierName: requirement.tierName,
        have: counts.get(requirement.tierName) ?? 0,
        required: requirement.required,
      }))
      .filter((requirement) => requirement.have < requirement.required);
  }

  detailFor(control: TeamFormGroup): string {
    const context = this.context();
    const id = control.controls.pokemon.value?.id;
    if (!context || !id) return '';

    const parts: string[] = [];
    if (this.isPoints && control.controls.tier.value)
      parts.push(control.controls.tier.value);

    const owner = context.owners.get(id);
    const onRoster = context.roster.some((pokemon) => pokemon.id === id);
    if (owner) parts.push(`From ${owner.teamName}`);
    else if (context.roster.length && !onRoster) parts.push('Added');

    return parts.join(' · ');
  }

  clearRow(index: number): void {
    this.teamControls[index].controls.pokemon.setValue(null);
    this.onClear(index);
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

  get matchesRoster(): boolean {
    const { added, dropped } = this.changes;
    return !added.length && !dropped.length;
  }

  resetToRoster(): void {
    const roster = this.context()?.roster ?? [];
    const kept = new Set<string>();
    const open: TeamFormGroup[] = [];

    for (const control of this.teamControls) {
      const id = control.controls.pokemon.value?.id;
      if (control.controls.locked.value && id) kept.add(id);
      else open.push(control);
    }

    const missing = roster.filter((pokemon) => !kept.has(pokemon.id));
    open.forEach((control, index) =>
      control.controls.pokemon.setValue(missing[index] ?? null, {
        emitEvent: false,
      }),
    );
    this.draftFormGroup?.controls.team.updateValueAndValidity();
  }

  restore(pokemon: PlannerPokemon): void {
    const slot = this.teamControls.find(
      (control) =>
        !control.controls.locked.value && !control.controls.pokemon.value?.id,
    );
    slot?.controls.pokemon.setValue({ id: pokemon.id, name: pokemon.name });
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
