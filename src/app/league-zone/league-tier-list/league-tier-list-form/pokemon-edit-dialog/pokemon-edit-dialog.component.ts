import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { SlideToggleComponent } from '../../../../util/inputs/slide-toggle/slide-toggle.component';
import { EditTierPokemon } from '../league-tier-list-form.component';
import {
  LeagueTier,
  LeagueTierGroup,
} from '../../../league-sign-up/league-sign-up.component';

export interface PokemonEditDialogData {
  pokemon: EditTierPokemon &
    Partial<{
      abilities: string[];
      originalTierName: string;
      selectedAbilities: string[];
    }>;
  currentTier: LeagueTier;
  tierGroups: LeagueTierGroup[];
}

@Component({
  selector: 'pdz-pokemon-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    SpriteComponent,
    SlideToggleComponent,
    MatCheckboxModule,
  ],
  templateUrl: './pokemon-edit-dialog.component.html',
  styleUrls: ['./pokemon-edit-dialog.component.scss'],
})
export class PokemonEditDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<PokemonEditDialogComponent>>(MatDialogRef);
  data = inject<PokemonEditDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  editForm!: FormGroup;

  ngOnInit(): void {
    this.editForm = this.fb.group({
      currentTier: [this.data.currentTier?.name || null, Validators.required],
      banNotes: [this.data.pokemon.banNotes || ''],
      selectedAbilities: this.fb.group({}),
    });

    this.addAbilityControls();
  }

  addAbilityControls(): void {
    const abilities = this.data.pokemon.abilities || [];
    const initiallySelected = this.data.pokemon.selectedAbilities || [];
    const abilitiesGroup = this.editForm.get('selectedAbilities') as FormGroup;

    abilities.forEach((ability: string) => {
      const isSelected = initiallySelected.includes(ability);
      abilitiesGroup.addControl(ability, this.fb.control(isSelected));
    });
  }

  onSave(): void {
    if (this.editForm.valid) {
      const formValues = this.editForm.value;
      const selectedAbilitiesObj = formValues.selectedAbilities || {};
      const selectedAbilityNames = Object.keys(selectedAbilitiesObj).filter(
        (key) => selectedAbilitiesObj[key] === true,
      );

      const resultData = {
        updatedTier: formValues.currentTier,
        updatedBanNotes: formValues.banNotes,
        updatedSelectedAbilities: selectedAbilityNames,
      };

      console.log('Data being returned:', resultData);
      this.dialogRef.close(resultData);
    } else {
      this.editForm.markAllAsTouched();
      console.error('Form is invalid. Cannot save.');
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  get abilityNames(): string[] {
    return (
      this.data.pokemon.abilities || ['Unnerve', 'Levitate', 'Volt Absorb']
    );
  }
}
