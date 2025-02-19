import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Pokemon } from '../../interfaces/draft';
import { PokemonSelectComponent } from '../../util/pokemon-select/pokemon-select.component';
import { DraftFormGroup } from '../plannner.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'planner-team',
  standalone: true,
  styleUrl: './team.component.scss',
  templateUrl: './team.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    PokemonSelectComponent,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    CdkDragPreview,
    SpriteComponent,
  ],
})
export class PlannerTeamComponent {
  @Input()
  draftFormGroup?: DraftFormGroup;

  get min() {
    return this.draftFormGroup?.controls.min.value ?? 0;
  }

  get remainingPokemon() {
    const tiered =
      this.draftFormGroup?.controls.team?.value.filter(
        (form) => form.pokemon?.id && form.pokemon.id != '',
      ).length || 0;
    const mons = this.min - tiered;
    return mons > 1 ? mons : 1;
  }

  get isPoints() {
    return (
      !this.draftFormGroup ||
      this.draftFormGroup?.controls.system.value === 'points'
    );
  }

  get remainingPoints(): number {
    const teamControls = this.draftFormGroup?.controls.team.controls ?? [];
    const totalUsed = teamControls.reduce(
      (sum, control) => sum + (control.controls.value.value ?? 0),
      0,
    );
    return this.draftFormGroup!.controls.totalPoints.value - totalUsed;
  }

  minMaxStyle(i: number) {
    return this.min
      ? i < this.min
        ? 'border-menu-500'
        : 'border-menu-300 text-menu-500'
      : '';
  }

  resultSelected(formGroup: AbstractControl, result: Pokemon | null) {
    if (result) {
      formGroup.patchValue({ name: result.name, id: result.id });
    } else {
      formGroup.patchValue({ name: null, id: null });
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.draftFormGroup)
      moveItemInArray(
        this.draftFormGroup.controls.team.controls,
        event.previousIndex,
        event.currentIndex,
      );
  }
}
