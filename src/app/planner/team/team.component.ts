import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { TeamFormGroup } from '../plannner.component';

@Component({
  selector: 'planner-team',
  standalone: true,
  styleUrl: './team.component.scss',
  templateUrl: './team.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    SelectSearchComponent,
  ],
})
export class PlannerTeamComponent {
  @Input()
  teamArray?: FormArray<TeamFormGroup>;

  @Input()
  min?: number;

  @Input()
  isPoints: boolean = false;

  names = nameList();

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
}
