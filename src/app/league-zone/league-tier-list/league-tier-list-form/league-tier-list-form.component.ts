import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import {
  LeagueTier,
  LeagueTierGroup,
  TierPokemon,
} from '../../../interfaces/tier-pokemon.interface';
import { SORT_MAP, SortOption } from '../tier-list.utils';
import {
  PokemonEditDialogComponent,
  PokemonEditDialogData,
} from './pokemon-edit-dialog/pokemon-edit-dialog.component';
import { TierEditDialogComponent } from './tier-edit-dialog/tier-edit-dialog.component';
import { TierGroupEditDialogComponent } from './tier-group-edit-dialog/tier-group-edit-dialog.component';

export type EditTierPokemon = TierPokemon & {
  moveHistory?: Array<{
    fromTierIndex: number;
    toTierIndex: number;
    fromPosition: number;
    toPosition: number;
  }>;
};

interface EditableTier {
  name: string;
  pokemon: EditTierPokemon[];
}

@Component({
  selector: 'pdz-league-tier-list-form',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatTooltipModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    SpriteComponent,
    LoadingComponent,
    MatDialogModule,
    DragDropModule,
  ],
  templateUrl: './league-tier-list-form.component.html',
  styleUrls: ['./league-tier-list-form.component.scss'],
})
export class LeagueTierListFormComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // State
  tiers = signal<EditableTier[] | undefined>(undefined);
  nullTier = signal<EditableTier | undefined>(undefined);
  sortBy = signal<SortOption>('BST');
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);

  // Multi-select state
  selectedPokemonIds = signal<Set<string>>(new Set());
  lastSelectedPokemon: { pokemon: EditTierPokemon; tier: EditableTier } | null =
    null;
  isDragging = signal<boolean>(false);

  ngOnInit(): void {
    this.loadTierList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTierList(): void {
    this.isLoading.set(true);
    this.leagueService
      .getTierListEdit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Flatten tier groups into a single array of tiers
          const flatTiers = (data.tierList as LeagueTierGroup[]).flatMap(
            (group) => group.tiers,
          );

          // Separate Null tier (trash) from regular tiers
          const nullTierIndex = flatTiers.findIndex(
            (tier) => tier.name.toLowerCase() === 'null',
          );

          if (nullTierIndex !== -1) {
            this.nullTier.set(flatTiers[nullTierIndex] as EditableTier);
            flatTiers.splice(nullTierIndex, 1);
          }

          this.tiers.set(flatTiers as EditableTier[]);
          this.isLoading.set(false);
          this.hasUnsavedChanges.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open('Failed to load tier list', 'Close', {
            duration: 3000,
          });
          console.error('Failed to load tier list:', err);
        },
      });
  }

  onDragStarted(): void {
    this.isDragging.set(true);
  }

  onDrop(
    event: CdkDragDrop<EditableTier>,
    tierIndex: number,
    isNullTier = false,
  ): void {
    // Reset drag state
    setTimeout(() => this.isDragging.set(false), 100);

    const draggedPokemon =
      event.previousContainer.data.pokemon[event.previousIndex];
    const sameTier = event.previousContainer === event.container;
    const selectedIds = this.selectedPokemonIds();
    const isDraggingSelected = selectedIds.has(draggedPokemon.id);

    // Handle reordering within the same tier (no sorting, just reorder)
    if (sameTier) {
      const pokemonArray = event.container.data.pokemon;
      const movedPokemon = pokemonArray.splice(event.previousIndex, 1)[0];
      pokemonArray.splice(event.currentIndex, 0, movedPokemon);
      this.hasUnsavedChanges.set(true);
      return;
    }

    // If dragging a selected Pokemon with multiple selections, move all selected
    if (isDraggingSelected && selectedIds.size > 1) {
      // Don't use the event's transfer - manually move all selected
      this.moveSelectedToTier(event.container.data);
      return;
    }

    // Moving single Pokemon between different tiers
    let prevTierIndex = this.findTierIndex(event.previousContainer.data);
    const actualTierIndex = isNullTier
      ? (this.tiers()?.length ?? 0)
      : tierIndex;

    if (!draggedPokemon.moveHistory) {
      draggedPokemon.moveHistory = [];
    }

    draggedPokemon.moveHistory.push({
      fromTierIndex: prevTierIndex,
      toTierIndex: actualTierIndex,
      fromPosition: event.previousIndex,
      toPosition: event.currentIndex,
    });

    // Transfer to new tier
    transferArrayItem(
      event.previousContainer.data.pokemon,
      event.container.data.pokemon,
      event.previousIndex,
      event.container.data.pokemon.length, // Add to end
    );

    // Auto-sort the destination tier
    const sortBy = this.sortBy();
    event.container.data.pokemon.sort(SORT_MAP[sortBy]);

    this.hasUnsavedChanges.set(true);
  }

  private findTierIndex(tier: EditableTier): number {
    const tiers = this.tiers();
    if (!tiers) return -1;

    // Check if it's the null tier
    if (tier === this.nullTier()) {
      return tiers.length; // Null tier is conceptually after all regular tiers
    }

    return tiers.indexOf(tier);
  }

  isNullTier(tier: EditableTier): boolean {
    return tier === this.nullTier();
  }

  undoLastMove(pokemon: EditTierPokemon): void {
    if (!pokemon.moveHistory || pokemon.moveHistory.length === 0) return;

    const lastMove = pokemon.moveHistory.pop()!;
    const tiers = this.tiers();
    const nullTier = this.nullTier();
    if (!tiers) return;

    const fromTier =
      lastMove.toTierIndex >= tiers.length
        ? nullTier
        : tiers[lastMove.toTierIndex];
    const toTier =
      lastMove.fromTierIndex >= tiers.length
        ? nullTier
        : tiers[lastMove.fromTierIndex];

    if (!fromTier || !toTier) return;

    const currentIndex = fromTier.pokemon.indexOf(pokemon);
    if (currentIndex === -1) return;

    fromTier.pokemon.splice(currentIndex, 1);
    toTier.pokemon.splice(lastMove.fromPosition, 0, pokemon);

    this.snackBar.open('Move undone', undefined, { duration: 2000 });
  }

  onPokemonClick(
    pokemon: EditTierPokemon,
    tier: EditableTier,
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    // Don't handle clicks during or immediately after drag
    if (this.isDragging()) {
      return;
    }

    const selectedIds = this.selectedPokemonIds();

    // Ctrl/Cmd key - toggle individual selection
    if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(pokemon.id)) {
        newSelected.delete(pokemon.id);
      } else {
        newSelected.add(pokemon.id);
      }
      this.selectedPokemonIds.set(newSelected);
      this.lastSelectedPokemon = { pokemon, tier };
      return;
    }

    // Shift key - range selection
    if (event.shiftKey && this.lastSelectedPokemon) {
      const newSelected = new Set(selectedIds);
      const rangeSelection = this.getPokemonRange(this.lastSelectedPokemon, {
        pokemon,
        tier,
      });
      rangeSelection.forEach((id) => newSelected.add(id));
      this.selectedPokemonIds.set(newSelected);
      return;
    }

    // No modifier - toggle selection
    this.togglePokemonSelection(pokemon, tier);
  }

  onEditPokemon(
    pokemon: EditTierPokemon,
    tier: EditableTier,
    event: Event,
  ): void {
    event.stopPropagation();
    this.openPokemonDialog(pokemon, tier);
  }

  togglePokemonSelection(pokemon: EditTierPokemon, tier: EditableTier): void {
    const selectedIds = this.selectedPokemonIds();
    const newSelected = new Set(selectedIds);

    if (newSelected.has(pokemon.id)) {
      newSelected.delete(pokemon.id);
    } else {
      newSelected.add(pokemon.id);
    }

    this.selectedPokemonIds.set(newSelected);
    this.lastSelectedPokemon = { pokemon, tier };
  }

  private getPokemonRange(
    start: { pokemon: EditTierPokemon; tier: EditableTier },
    end: { pokemon: EditTierPokemon; tier: EditableTier },
  ): string[] {
    // If same tier, get range within tier
    if (start.tier === end.tier) {
      const startIdx = start.tier.pokemon.indexOf(start.pokemon);
      const endIdx = end.tier.pokemon.indexOf(end.pokemon);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      return start.tier.pokemon.slice(minIdx, maxIdx + 1).map((p) => p.id);
    }

    // Different tiers - just select both
    return [start.pokemon.id, end.pokemon.id];
  }

  clearSelection(): void {
    this.selectedPokemonIds.set(new Set());
    this.lastSelectedPokemon = null;
  }

  isPokemonSelected(pokemon: EditTierPokemon): boolean {
    return this.selectedPokemonIds().has(pokemon.id);
  }

  moveSelectedToTier(targetTier: EditableTier): void {
    const selectedIds = this.selectedPokemonIds();
    if (selectedIds.size === 0) return;

    const tiers = this.tiers();
    const nullTier = this.nullTier();
    if (!tiers) return;

    const allTiers = nullTier ? [...tiers, nullTier] : tiers;
    const sortBy = this.sortBy();
    const targetTierIndex = this.findTierIndex(targetTier);

    // Collect selected Pokemon from all tiers with their source info
    const selectedPokemon: EditTierPokemon[] = [];
    allTiers.forEach((tier, tierIndex) => {
      const matches = tier.pokemon.filter((p) => selectedIds.has(p.id));

      // Add move history to each Pokemon
      matches.forEach((pokemon, index) => {
        if (!pokemon.moveHistory) {
          pokemon.moveHistory = [];
        }
        const sourcePosition = tier.pokemon.indexOf(pokemon);
        pokemon.moveHistory.push({
          fromTierIndex: tierIndex,
          toTierIndex: targetTierIndex,
          fromPosition: sourcePosition,
          toPosition: -1, // Will be sorted anyway
        });
      });

      selectedPokemon.push(...matches);
      // Remove from source tiers
      tier.pokemon = tier.pokemon.filter((p) => !selectedIds.has(p.id));
    });

    // Add to target tier and sort
    targetTier.pokemon.push(...selectedPokemon);
    targetTier.pokemon.sort(SORT_MAP[sortBy]);

    this.clearSelection();
    this.hasUnsavedChanges.set(true);
    this.snackBar.open(`Moved ${selectedPokemon.length} Pokemon`, undefined, {
      duration: 2000,
    });
  }

  private openPokemonDialog(
    pokemon: EditTierPokemon,
    tier: EditableTier,
  ): void {
    const dialogData: PokemonEditDialogData = {
      pokemon: pokemon,
      currentTier: tier,
      tierGroups: [{ tiers: this.tiers() ?? [] }] as LeagueTierGroup[],
    };

    const dialogRef = this.dialog.open(PokemonEditDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: dialogData,
      autoFocus: 'dialog',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.hasUnsavedChanges.set(true);
          this.snackBar.open('Pokemon updated', undefined, { duration: 2000 });
        }
      });
  }

  addNewTier(): void {
    const tiers = this.tiers();
    if (!tiers) return;

    const newTierName = prompt('Enter tier name:');
    if (!newTierName || !newTierName.trim()) return;

    tiers.push({
      name: newTierName.trim(),
      pokemon: [],
    });

    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
    this.snackBar.open(`Tier "${newTierName}" added`, undefined, {
      duration: 2000,
    });
  }

  editTier(tier: EditableTier): void {
    const dialogRef = this.dialog.open(TierEditDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { tier },
      autoFocus: 'dialog',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.hasUnsavedChanges.set(true);
          this.snackBar.open('Tier updated', undefined, { duration: 2000 });
        }
      });
  }

  deleteTier(tierIndex: number): void {
    const tiers = this.tiers();
    if (!tiers) return;

    const tier = tiers[tierIndex];
    if (
      tier.pokemon.length > 0 &&
      !confirm(
        `Tier "${tier.name}" contains ${tier.pokemon.length} Pokemon. Delete anyway?`,
      )
    ) {
      return;
    }

    tiers.splice(tierIndex, 1);

    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
    this.snackBar.open(`Tier "${tier.name}" deleted`, undefined, {
      duration: 2000,
    });
  }

  sortTier(tier: EditableTier): void {
    const sortBy = this.sortBy();
    tier.pokemon.sort(SORT_MAP[sortBy]);
    this.tiers.set([...(this.tiers() ?? [])]);
  }

  sortAllTiers(): void {
    const tiers = this.tiers();
    if (!tiers) return;

    const sortBy = this.sortBy();
    tiers.forEach((tier) => {
      tier.pokemon.sort(SORT_MAP[sortBy]);
    });

    this.tiers.set([...tiers]);
    this.snackBar.open('All tiers sorted (excluding Null)', undefined, {
      duration: 2000,
    });
  }

  saveTierList(): void {
    this.isLoading.set(true);
    this.snackBar.open('Saving tier list...', undefined);

    // TODO: Implement actual save to API
    setTimeout(() => {
      this.isLoading.set(false);
      this.hasUnsavedChanges.set(false);
      this.snackBar.open('Tier list saved successfully', undefined, {
        duration: 3000,
      });
    }, 1000);
  }

  resetChanges(): void {
    if (!confirm('Discard all unsaved changes?')) return;
    this.loadTierList();
  }

  filterPokemon(pokemon: EditTierPokemon): boolean {
    const search = this.searchText().toLowerCase();
    if (!search) return true;
    return pokemon.name.toLowerCase().includes(search);
  }
}
