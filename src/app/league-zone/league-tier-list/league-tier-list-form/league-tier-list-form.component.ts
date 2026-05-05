import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { TierPokemon } from '../../../interfaces/tier-pokemon.interface';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { SORT_MAP, SortOption } from '../tier-list.utils';
import {
  PokemonEditDialogComponent,
  PokemonEditDialogData,
} from './pokemon-edit-dialog/pokemon-edit-dialog.component';
import {
  TierDialogResult,
  TierEditDialogComponent,
} from './tier-edit-dialog/tier-edit-dialog.component';

export type EditTierPokemon = TierPokemon;

interface MoveRecord {
  pokemon: EditTierPokemon;
  fromTier: EditableTier;
  fromIndex: number;
  toTier: EditableTier;
}

interface HistoryEntry {
  moves: MoveRecord[];
}

interface EditableTier {
  name: string;
  cost?: number;
  required?: number;
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
  untiered = signal<EditableTier | undefined>(undefined);
  sortBy = signal<SortOption>('BST');
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);

  UNTIERED_TIER_NAME = 'Untiered';
  BANNED_TIER_NAME = 'Banned';
  banned = signal<EditableTier | undefined>(undefined);

  // Undo/redo history
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private savedHistoryDepth = 0;
  readonly MAX_HISTORY = 50;
  canUndo = signal(false);
  canRedo = signal(false);

  // Flash animation state
  flashedPokemonIds = signal<Set<string>>(new Set());
  private flashTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Multi-select state
  selectedPokemonIds = signal<Set<string>>(new Set());
  lastSelectedPokemon: { pokemon: EditTierPokemon; tier: EditableTier } | null =
    null;
  isDragging = signal<boolean>(false);

  // Native drag state
  draggedPokemon: EditTierPokemon | null = null;
  draggedFromTier: EditableTier | null = null;
  dragOverTier = signal<EditableTier | null>(null);
  dragCount = signal<number>(0);

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
          const flatTiers = [...data.tierList];

          const nullTierIndex = flatTiers.findIndex(
            (tier) =>
              tier.name.toLowerCase() === this.UNTIERED_TIER_NAME.toLowerCase(),
          );

          const untieredTier: EditableTier =
            nullTierIndex !== -1
              ? (flatTiers.splice(nullTierIndex, 1)[0] as EditableTier)
              : { name: this.UNTIERED_TIER_NAME, pokemon: [] };

          // Extract pokemon with draftBanned: true from all tiers into the banned section
          const bannedPokemon: EditTierPokemon[] = [];
          const extractBanned = (tier: EditableTier) => {
            const kept: EditTierPokemon[] = [];
            (tier.pokemon as EditTierPokemon[]).forEach((p) =>
              p.draftBanned ? bannedPokemon.push(p) : kept.push(p),
            );
            tier.pokemon = kept;
          };
          (flatTiers as EditableTier[]).forEach(extractBanned);
          extractBanned(untieredTier);
          bannedPokemon.forEach((p) => delete p.draftBanned);

          this.undoStack = [];
          this.redoStack = [];
          this.savedHistoryDepth = 0;
          this.canUndo.set(false);
          this.canRedo.set(false);
          this.untiered.set(untieredTier);
          this.banned.set({
            name: this.BANNED_TIER_NAME,
            pokemon: bannedPokemon,
          });
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

  onDragStart(
    event: DragEvent,
    pokemon: EditTierPokemon,
    tier: EditableTier,
  ): void {
    this.draggedPokemon = pokemon;
    this.draggedFromTier = tier;
    this.isDragging.set(true);
    const selectedIds = this.selectedPokemonIds();
    this.dragCount.set(
      selectedIds.has(pokemon.id) && selectedIds.size > 1
        ? selectedIds.size
        : 1,
    );
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', pokemon.id);
    }
  }

  onDragEnd(): void {
    this.draggedPokemon = null;
    this.draggedFromTier = null;
    this.dragOverTier.set(null);
    this.dragCount.set(0);
    setTimeout(() => this.isDragging.set(false), 100);
  }

  onDragOver(event: DragEvent, tier: EditableTier): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverTier() !== tier) {
      this.dragOverTier.set(tier);
    }
  }

  onDragLeave(event: DragEvent, tier: EditableTier): void {
    const relatedTarget = event.relatedTarget as Node | null;
    const currentTarget = event.currentTarget as Node;
    if (relatedTarget && currentTarget.contains(relatedTarget)) return;
    if (this.dragOverTier() === tier) {
      this.dragOverTier.set(null);
    }
  }

  onDrop(event: DragEvent, targetTier: EditableTier): void {
    event.preventDefault();
    this.dragOverTier.set(null);

    const pokemon = this.draggedPokemon;
    const fromTier = this.draggedFromTier;

    this.draggedPokemon = null;
    this.draggedFromTier = null;
    this.isDragging.set(false);

    if (!pokemon || !fromTier || fromTier === targetTier) return;

    const selectedIds = this.selectedPokemonIds();
    if (selectedIds.has(pokemon.id) && selectedIds.size > 1) {
      this.moveSelectedToTier(targetTier);
      return;
    }

    const fromIndex = fromTier.pokemon.indexOf(pokemon);
    this.pushHistory({
      moves: [{ pokemon, fromTier, fromIndex, toTier: targetTier }],
    });

    fromTier.pokemon.splice(fromIndex, 1);
    targetTier.pokemon.push(pokemon);
    targetTier.pokemon.sort(SORT_MAP[this.sortBy()]);

    this.flashPokemon([pokemon.id]);
    this.hasUnsavedChanges.set(true);
  }

  isTierDragOver(tier: EditableTier): boolean {
    return this.dragOverTier() === tier;
  }

  isUntiered(tier: EditableTier): boolean {
    return tier === this.untiered();
  }

  private flashPokemon(ids: string[]): void {
    const current = new Set(this.flashedPokemonIds());
    ids.forEach((id) => {
      current.add(id);
      // Reset any existing timeout for this id
      const existing = this.flashTimeouts.get(id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        this.flashedPokemonIds.update((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
        this.flashTimeouts.delete(id);
      }, 600);
      this.flashTimeouts.set(id, t);
    });
    this.flashedPokemonIds.set(current);
  }

  isPokemonFlashing(pokemon: EditTierPokemon): boolean {
    return this.flashedPokemonIds().has(pokemon.id);
  }

  private pushHistory(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.canUndo.set(true);
    this.canRedo.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (event.key === 'Escape') {
      this.clearSelection();
      return;
    }

    if (isTyping) return;

    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
        event.preventDefault();
        this.redo();
      } else if (event.key === 's') {
        event.preventDefault();
        if (this.hasUnsavedChanges() && !this.isLoading()) {
          this.saveTierList();
        }
      } else if (event.key === 'a') {
        event.preventDefault();
        this.selectAll();
      }
    } else {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const untiered = this.untiered();
        if (this.selectedPokemonIds().size > 0 && untiered) {
          this.moveSelectedToTier(untiered);
        }
      } else if (event.key === 'b') {
        const bannedTier = this.banned();
        if (this.selectedPokemonIds().size > 0 && bannedTier) {
          this.moveSelectedToTier(bannedTier);
        }
      }
    }
  }

  selectAll(): void {
    const tiers = this.tiers();
    const nullTier = this.untiered();
    const bannedTier = this.banned();
    if (!tiers) return;

    const allTiers = [...tiers];
    if (nullTier) allTiers.push(nullTier);
    if (bannedTier) allTiers.push(bannedTier);

    const newSelected = new Set<string>();
    allTiers.forEach((tier) => {
      tier.pokemon.forEach((p) => {
        if (this.filterPokemon(p)) newSelected.add(p.id);
      });
    });
    this.selectedPokemonIds.set(newSelected);
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const entry = this.undoStack.pop()!;

    // Sort moves by fromIndex ascending within the same fromTier for correct position restoration
    const sortedMoves = [...entry.moves].sort((a, b) =>
      a.fromTier === b.fromTier ? a.fromIndex - b.fromIndex : 0,
    );

    sortedMoves.forEach((move) => {
      const currentIdx = move.toTier.pokemon.indexOf(move.pokemon);
      if (currentIdx === -1) return;
      move.toTier.pokemon.splice(currentIdx, 1);
      move.fromTier.pokemon.splice(move.fromIndex, 0, move.pokemon);
    });

    this.redoStack.push(entry);
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(true);
    this.hasUnsavedChanges.set(
      this.undoStack.length !== this.savedHistoryDepth,
    );
    this.tiers.set([...(this.tiers() ?? [])]);
    this.flashPokemon(entry.moves.map((m) => m.pokemon.id));
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const entry = this.redoStack.pop()!;

    entry.moves.forEach((move) => {
      const currentIdx = move.fromTier.pokemon.indexOf(move.pokemon);
      if (currentIdx === -1) return;
      move.fromTier.pokemon.splice(currentIdx, 1);
      move.toTier.pokemon.push(move.pokemon);
      move.toTier.pokemon.sort(SORT_MAP[this.sortBy()]);
    });

    this.undoStack.push(entry);
    this.canUndo.set(true);
    this.canRedo.set(this.redoStack.length > 0);
    this.hasUnsavedChanges.set(
      this.undoStack.length !== this.savedHistoryDepth,
    );
    this.tiers.set([...(this.tiers() ?? [])]);
    this.flashPokemon(entry.moves.map((m) => m.pokemon.id));
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
    const nullTier = this.untiered();
    if (!tiers) return;

    const bannedTier = this.banned();
    const allTiers = [...tiers];
    if (nullTier) allTiers.push(nullTier);
    if (bannedTier) allTiers.push(bannedTier);
    const sortBy = this.sortBy();

    // Collect moves before modifying arrays
    const moves: MoveRecord[] = [];
    allTiers.forEach((tier) => {
      tier.pokemon.forEach((pokemon, index) => {
        if (selectedIds.has(pokemon.id) && tier !== targetTier) {
          moves.push({
            pokemon,
            fromTier: tier,
            fromIndex: index,
            toTier: targetTier,
          });
        }
      });
    });

    if (moves.length === 0) return;
    this.pushHistory({ moves });

    // Remove from source tiers
    allTiers.forEach((tier) => {
      tier.pokemon = tier.pokemon.filter((p) => !selectedIds.has(p.id));
    });

    // Add to target tier and sort
    targetTier.pokemon.push(...moves.map((m) => m.pokemon));
    targetTier.pokemon.sort(SORT_MAP[sortBy]);

    this.flashPokemon(moves.map((m) => m.pokemon.id));
    this.clearSelection();
    this.hasUnsavedChanges.set(true);
    this.snackBar.open(`Moved ${moves.length} Pokemon`, undefined, {
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
      tiers: this.tiers() ?? [],
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

  moveTier(fromIndex: number, toIndex: number): void {
    const tiers = this.tiers();
    if (!tiers || toIndex < 0 || toIndex >= tiers.length) return;
    const [tier] = tiers.splice(fromIndex, 1);
    tiers.splice(toIndex, 0, tier);
    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
  }

  addNewTier(): void {
    const tiers = this.tiers();
    if (!tiers) return;

    const dialogRef = this.dialog.open(TierEditDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {},
      autoFocus: 'first-tabbable',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: TierDialogResult | null) => {
        if (!result) return;

        tiers.push({
          name: result.name,
          cost: result.cost,
          required: result.required,
          pokemon: [],
        });

        this.tiers.set([...tiers]);
        this.hasUnsavedChanges.set(true);
        this.snackBar.open(`Tier "${result.name}" added`, undefined, {
          duration: 2000,
        });
      });
  }

  editTier(tier: EditableTier): void {
    const dialogRef = this.dialog.open(TierEditDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { tier },
      autoFocus: 'first-tabbable',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: TierDialogResult | null) => {
        if (!result) return;
        tier.name = result.name;
        tier.cost = result.cost;
        tier.required = result.required;
        this.hasUnsavedChanges.set(true);
        this.snackBar.open('Tier updated', undefined, { duration: 2000 });
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

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'BST', label: 'BST' },
    { value: 'Name', label: 'A-Z' },
  ];

  setSortOption(option: SortOption): void {
    if (this.sortBy() === option) return;
    this.sortBy.set(option);
    const tiers = this.tiers();
    if (!tiers) return;
    tiers.forEach((tier) => tier.pokemon.sort(SORT_MAP[option]));
    this.tiers.set([...tiers]);
  }

  saveTierList(): void {
    this.isLoading.set(true);
    this.snackBar.open('Saving tier list...', undefined);

    const tiers = this.tiers();
    const nullTier = this.untiered();
    if (!tiers) {
      this.isLoading.set(false);
      this.snackBar.open('No tier data to save', 'Close', { duration: 3000 });
      return;
    }

    // Combine regular tiers with untiered for saving
    const allTiers = [...tiers];
    if (nullTier) allTiers.push(nullTier);

    // Convert to server format
    const tierData = allTiers.map((tier) => ({
      name: tier.name,
      cost: tier.cost ?? 0,
      pokemon: tier.pokemon.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    }));

    // Merge banned pokemon into untiered with banned: true
    const bannedTier = this.banned();
    if (bannedTier && bannedTier.pokemon.length > 0) {
      const untieredEntry = tierData.find(
        (t) => t.name === this.UNTIERED_TIER_NAME,
      );
      const bannedPayload = bannedTier.pokemon.map((p) => ({
        id: p.id,
        name: p.name,
        banned: true as const,
      }));
      if (untieredEntry) {
        untieredEntry.pokemon.push(...bannedPayload);
      } else {
        tierData.push({
          name: this.UNTIERED_TIER_NAME,
          cost: 0,
          pokemon: bannedPayload,
        });
      }
    }

    this.leagueService
      .saveTierListEdit(tierData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.savedHistoryDepth = this.undoStack.length;
          this.hasUnsavedChanges.set(false);
          this.snackBar.open(
            response.message || 'Tier list saved successfully',
            undefined,
            { duration: 3000 },
          );
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(
            'Failed to save tier list: ' + (err.error?.message || err.message),
            'Close',
            { duration: 5000 },
          );
          console.error('Failed to save tier list:', err);
        },
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  canDeactivate(): boolean {
    if (!this.hasUnsavedChanges()) return true;
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  }

  isSortingDisabled(_tier: EditableTier): boolean {
    return this.searchText().length > 0;
  }

  filterPokemon(pokemon: EditTierPokemon): boolean {
    const search = this.searchText().toLowerCase();
    if (!search) return true;
    return pokemon.name.toLowerCase().includes(search);
  }
}
