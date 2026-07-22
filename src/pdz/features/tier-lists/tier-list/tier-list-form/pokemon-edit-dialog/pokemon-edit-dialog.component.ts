import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
// Only the dialog ref/data tokens are used - the dialog's contents are plain
// markup, matching the draft team editor.
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LeagueTier } from '../../../tier-list.model';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { DataService } from '@pdz/core/services/data.service';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { EditTierPokemon } from '../tier-list-form.component';

export interface PokemonEditDialogData {
  pokemon: EditTierPokemon &
    Partial<{
      abilities: string[];
      originalTierName: string;
      selectedAbilities: string[];
    }>;
  currentTier: LeagueTier;
  tiers: LeagueTier[];
  ruleset?: string;
}

export interface PokemonEditDialogResult {
  updatedTier: string | null;
  updatedBanNotes: string;
  updatedSelectedAbilities: string[];
  updatedFormes: { id: string; name: string }[];
}

@Component({
  selector: 'pdz-pokemon-edit-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SpriteComponent,
    SlideToggleComponent,
  ],
  templateUrl: './pokemon-edit-dialog.component.html',
  styleUrls: ['./pokemon-edit-dialog.component.scss'],
})
export class PokemonEditDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<PokemonEditDialogComponent>>(MatDialogRef);
  data = inject<PokemonEditDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);

  editForm!: FormGroup;
  /** Every forme the ruleset knows for this species. */
  availableFormes: Pokemon[] = [];
  formesLoading = false;
  /** The base pokemon carrying the currently selected formes as `draftFormes`,
   * so the preview sprite renders (and rotates through) them live. */
  spritePokemon!: Pokemon<DraftOptions>;

  private selectedAbilities = new Set<string>();
  private selectedFormes = new Set<string>();

  ngOnInit(): void {
    this.editForm = this.fb.group({
      currentTier: [this.data.currentTier?.name || null, Validators.required],
      notes: [this.data.pokemon.notes || ''],
    });

    const abilities = this.data.pokemon.abilities ?? [];
    const bannedAbilities = this.data.pokemon.banned?.abilities ?? [];
    const initiallySelected =
      this.data.pokemon.selectedAbilities ??
      abilities.filter((ability) => !bannedAbilities.includes(ability));
    this.selectedAbilities = new Set(initiallySelected);

    this.selectedFormes = new Set(
      (this.data.pokemon.formes ?? []).map((forme) => forme.id),
    );

    this.rebuildSpritePokemon();
    this.loadFormes();
  }

  private loadFormes(): void {
    const ruleset = this.data.ruleset;
    if (!ruleset || !this.data.pokemon.id) return;

    this.formesLoading = true;
    this.dataService.getFormes(ruleset, this.data.pokemon.id).subscribe({
      next: (formes) => {
        this.availableFormes = formes;
        this.rebuildSpritePokemon();
        this.formesLoading = false;
      },
      error: () => {
        this.formesLoading = false;
      },
    });
  }

  /** Rebuilds the preview pokemon with the selected formes as `draftFormes`.
   * A fresh reference is required for the OnPush sprite to pick up the change. */
  private rebuildSpritePokemon(): void {
    const draftFormes = this.availableFormes.filter((forme) =>
      this.selectedFormes.has(forme.id),
    );
    this.spritePokemon = {
      ...(this.data.pokemon as unknown as Pokemon<DraftOptions>),
      draftFormes: draftFormes.length ? draftFormes : undefined,
    };
  }

  get abilityNames(): string[] {
    return this.data.pokemon.abilities || [];
  }

  isAbilitySelected(ability: string): boolean {
    return this.selectedAbilities.has(ability);
  }

  toggleAbility(ability: string): void {
    if (!this.selectedAbilities.delete(ability)) {
      this.selectedAbilities.add(ability);
    }
  }

  isFormeSelected(forme: Pokemon): boolean {
    return this.selectedFormes.has(forme.id);
  }

  toggleForme(forme: Pokemon): void {
    if (!this.selectedFormes.delete(forme.id)) {
      this.selectedFormes.add(forme.id);
    }
    this.rebuildSpritePokemon();
  }

  onSave(): void {
    if (!this.editForm.valid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValues = this.editForm.value;
    const resultData: PokemonEditDialogResult = {
      updatedTier: formValues.currentTier,
      updatedBanNotes: formValues.notes,
      updatedSelectedAbilities: this.abilityNames.filter((ability) =>
        this.selectedAbilities.has(ability),
      ),
      updatedFormes: this.availableFormes
        .filter((forme) => this.selectedFormes.has(forme.id))
        .map((forme) => ({ id: forme.id, name: forme.name })),
    };
    this.dialogRef.close(resultData);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
