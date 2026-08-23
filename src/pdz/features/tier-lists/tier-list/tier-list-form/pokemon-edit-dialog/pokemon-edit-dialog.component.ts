import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DataService } from '@pdz/core/services/data.service';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { LeagueTier } from '../../../tier-list.model';
import { EditTierPokemon } from '../tier-list-form.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';

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
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SpriteComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './pokemon-edit-dialog.component.html',
  styleUrls: ['./pokemon-edit-dialog.component.scss'],
})
export class PokemonEditDialogComponent implements OnInit {
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<PokemonEditDialogResult>;
  data = inject<PokemonEditDialogData>(DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);

  editForm = this.fb.nonNullable.group({
    currentTier: [this.data.currentTier?.name ?? (null as string | null)],
    notes: [this.data.pokemon.notes ?? ''],
  });

  /** Every forme the ruleset knows for this species. */
  availableFormes: Pokemon[] = [];
  formesLoading = false;
  /** The base pokemon carrying the currently selected formes as `draftFormes`,
   * so the preview sprite renders (and rotates through) them live. */
  spritePokemon!: Pokemon<DraftOptions>;

  private selectedAbilities = new Set<string>();
  private selectedFormes = new Set<string>();

  ngOnInit(): void {
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

    const { currentTier, notes } = this.editForm.getRawValue();
    this.ref.close({
      updatedTier: currentTier,
      updatedBanNotes: notes,
      updatedSelectedAbilities: this.abilityNames.filter((ability) =>
        this.selectedAbilities.has(ability),
      ),
      updatedFormes: this.availableFormes
        .filter((forme) => this.selectedFormes.has(forme.id))
        .map((forme) => ({ id: forme.id, name: forme.name })),
    });
  }
}
