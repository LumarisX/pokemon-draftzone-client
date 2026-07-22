import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
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
import { first, takeUntil } from 'rxjs/operators';
import { TierPokemon } from '../../tier-list.model';
import { TierListService } from '../../tier-list.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  TierListSettingsDialogComponent,
  TierListSettingsDialogData,
} from '../tier-list-settings-dialog/tier-list-settings-dialog.component';
import { matchesSearchText, SORT_MAP, SortOption } from '../tier-list.utils';
import {
  ImportDialogComponent,
  ImportDialogData,
  ImportDialogResult,
} from './import-dialog/import-dialog.component';
import {
  PokemonEditDialogComponent,
  PokemonEditDialogData,
  PokemonEditDialogResult,
} from './pokemon-edit-dialog/pokemon-edit-dialog.component';
import {
  TierDialogResult,
  TierEditDialogComponent,
} from './tier-edit-dialog/tier-edit-dialog.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

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
  selector: 'pdz-tier-list-form',
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
    IconComponent,
  ],
  templateUrl: './tier-list-form.component.html',
  styleUrls: ['./tier-list-form.component.scss'],
})
export class TierListFormComponent implements OnInit, OnDestroy {
  private tierListService = inject(TierListService);
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
  tierListName = signal<string>('Tier List');
  /** Needed to look up a species' formes when editing an entry. */
  ruleset = signal<string | undefined>(undefined);
  showExportMenu = signal<boolean>(false);
  showImportMenu = signal<boolean>(false);

  UNTIERED_TIER_NAME = 'Untiered';
  BANNED_TIER_NAME = 'Banned';
  banned = signal<EditableTier | undefined>(undefined);
  readonly DEFAULT_NULL_PANEL_RATIO = 2 / 3;
  readonly MIN_NULL_PANEL_RATIO = 0.2;
  readonly MAX_NULL_PANEL_RATIO = 0.8;
  nullPanelRatio = signal<number>(this.DEFAULT_NULL_PANEL_RATIO);
  untieredPanelFlex = computed(
    () => `${this.nullPanelRatio().toFixed(4)} 1 0%`,
  );
  bannedPanelFlex = computed(
    () => `${(1 - this.nullPanelRatio()).toFixed(4)} 1 0%`,
  );
  isResizingNullPanel = signal<boolean>(false);

  private resizingPointerId: number | null = null;
  private resizeStartY = 0;
  private resizeStartRatio = this.DEFAULT_NULL_PANEL_RATIO;
  private resizeContainerHeight = 1;

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
    this.stopNullPanelResize();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTierList(): void {
    this.isLoading.set(true);
    this.tierListService
      .getTierListEdit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data.name) this.tierListName.set(data.name);
          this.ruleset.set(data.ruleset);
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

  onNullPanelResizeStart(event: PointerEvent): void {
    const splitter = event.currentTarget as HTMLElement | null;
    const container = splitter?.closest(
      '.tier-container--null',
    ) as HTMLElement | null;
    if (!splitter || !container) return;

    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);

    this.resizingPointerId = event.pointerId;
    this.resizeStartY = event.clientY;
    this.resizeStartRatio = this.nullPanelRatio();
    this.resizeContainerHeight = Math.max(container.clientHeight, 1);
    this.isResizingNullPanel.set(true);
  }

  onNullPanelSplitterKeyDown(event: KeyboardEvent): void {
    const fineStep = 0.02;
    const coarseStep = 0.05;
    const step = event.shiftKey ? coarseStep : fineStep;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.nullPanelRatio.update((ratio) =>
        this.clampNullPanelRatio(ratio - step),
      );
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.nullPanelRatio.update((ratio) =>
        this.clampNullPanelRatio(ratio + step),
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.nullPanelRatio.set(this.DEFAULT_NULL_PANEL_RATIO);
    }
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (!this.isResizingNullPanel()) return;
    if (
      this.resizingPointerId !== null &&
      event.pointerId !== this.resizingPointerId
    ) {
      return;
    }

    const deltaY = event.clientY - this.resizeStartY;
    const nextRatio =
      this.resizeStartRatio + deltaY / this.resizeContainerHeight;
    this.nullPanelRatio.set(this.clampNullPanelRatio(nextRatio));
  }

  @HostListener('document:pointerup', ['$event'])
  onDocumentPointerUp(event: PointerEvent): void {
    if (!this.isResizingNullPanel()) return;
    if (
      this.resizingPointerId !== null &&
      event.pointerId !== this.resizingPointerId
    ) {
      return;
    }

    this.stopNullPanelResize();
  }

  @HostListener('document:pointercancel', ['$event'])
  onDocumentPointerCancel(event: PointerEvent): void {
    if (!this.isResizingNullPanel()) return;
    if (
      this.resizingPointerId !== null &&
      event.pointerId !== this.resizingPointerId
    ) {
      return;
    }

    this.stopNullPanelResize();
  }

  private stopNullPanelResize(): void {
    this.resizingPointerId = null;
    this.isResizingNullPanel.set(false);
  }

  private clampNullPanelRatio(value: number): number {
    return Math.max(
      this.MIN_NULL_PANEL_RATIO,
      Math.min(this.MAX_NULL_PANEL_RATIO, value),
    );
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

  private spriteCache = new WeakMap<
    EditTierPokemon,
    { formes: EditTierPokemon['formes']; ref: EditTierPokemon }
  >();

  /** The sprite reads `draftFormes`, but a tier entry stores its allowed
   * formes in `formes`; expose a derived pokemon so the sprite renders the
   * forme stack. Cached per entry (and invalidated when `formes` changes) so
   * the OnPush sprite keeps a stable reference. */
  spriteFor(pokemon: EditTierPokemon): EditTierPokemon {
    if (!pokemon.formes?.length) return pokemon;
    const cached = this.spriteCache.get(pokemon);
    if (cached && cached.formes === pokemon.formes) return cached.ref;
    const ref = { ...pokemon, draftFormes: pokemon.formes };
    this.spriteCache.set(pokemon, { formes: pokemon.formes, ref });
    return ref;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-control')) {
      this.showExportMenu.set(false);
    }
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
      ruleset: this.ruleset(),
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
      .subscribe((result: PokemonEditDialogResult | undefined) => {
        if (!result) return;

        const allAbilities = pokemon.abilities ?? [];
        const selectedAbilities = result.updatedSelectedAbilities ?? [];
        const bannedAbilities = allAbilities.filter(
          (ability) => !selectedAbilities.includes(ability),
        );

        pokemon.notes = result.updatedBanNotes?.trim() || undefined;
        pokemon.formes = result.updatedFormes?.length
          ? result.updatedFormes
          : undefined;

        if (bannedAbilities.length > 0) {
          pokemon.banned = {
            ...(pokemon.banned ?? {}),
            abilities: bannedAbilities,
          };
        } else if (pokemon.banned) {
          const nextBanned = { ...pokemon.banned };
          delete nextBanned.abilities;
          pokemon.banned =
            nextBanned.moves?.length || nextBanned.tera
              ? nextBanned
              : undefined;
        }

        const targetTierName = result.updatedTier;
        if (targetTierName !== tier.name) {
          const targetTier =
            targetTierName === null
              ? this.untiered()
              : this.tiers()?.find((t) => t.name === targetTierName);

          if (targetTier) {
            tier.pokemon = tier.pokemon.filter((p) => p.id !== pokemon.id);
            targetTier.pokemon.push(pokemon);
            targetTier.pokemon.sort(SORT_MAP[this.sortBy()]);
          }
        }

        this.tiers.set([...(this.tiers() ?? [])]);
        this.untiered.set(
          this.untiered()
            ? { ...(this.untiered() as EditableTier) }
            : undefined,
        );
        this.hasUnsavedChanges.set(true);
        this.snackBar.open('Pokemon updated', undefined, { duration: 2000 });
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

  exportCsv(): void {
    const tiers = this.tiers();
    const banned = this.banned();
    if (!tiers) return;
    this.showExportMenu.set(false);

    // Build ordered column list: Banned first, then regular tiers
    const columns: { name: string; pokemon: EditTierPokemon[] }[] = [];
    if (banned && banned.pokemon.length > 0) {
      columns.push(banned);
    }
    columns.push(...tiers);

    const maxRows = Math.max(...columns.map((c) => c.pokemon.length), 0);

    const rows: string[] = [columns.map((c) => this.csvCell(c.name)).join(',')];

    for (let i = 0; i < maxRows; i++) {
      const row = columns.map((c) => {
        const p = c.pokemon[i];
        return p ? this.csvCell(p.name) : '';
      });
      rows.push(row.join(','));
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.tierListName()}-tier-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string): string {
    if (/[,"\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  importCsv(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.openCsvImportDialog(text);
      };
      reader.readAsText(file);
    };
    input.click();
    this.showImportMenu.set(false);
  }

  private openCsvImportDialog(csvText: string): void {
    const tiers = this.tiers();
    const untiered = this.untiered();
    if (!tiers || !untiered) return;

    const lines = csvText
      .replace(/\r/g, '')
      .split('\n')
      .filter((l) => l.trim());
    if (lines.length < 1) {
      this.snackBar.open('CSV file is empty.', 'Close', { duration: 4000 });
      return;
    }

    const headers = this.parseCsvRow(lines[0]).map((h) => h.trim());
    const PREVIEW_COUNT = 999;
    const columns = headers.map((header, col) => {
      const preview: string[] = [];
      for (
        let row = 1;
        row < lines.length && preview.length < PREVIEW_COUNT;
        row++
      ) {
        const cells = this.parseCsvRow(lines[row]);
        const val = (cells[col] ?? '').trim();
        if (val) preview.push(val);
      }
      return { csvHeader: header, preview };
    });

    const dialogRef = this.dialog.open(ImportDialogComponent, {
      data: {
        columns,
        availableTiers: tiers.map((t) => t.name),
        untieredName: this.UNTIERED_TIER_NAME,
        bannedName: this.BANNED_TIER_NAME,
      } satisfies ImportDialogData,
      width: '44rem',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });

    dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe((result: ImportDialogResult | null) => {
        if (!result) return;
        this.applyCsvImport(csvText, headers, result);
      });
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"' && row[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  private applyCsvImport(
    csvText: string,
    headers: string[],
    columnMapping: ImportDialogResult,
  ): void {
    const tiers = this.tiers();
    const untiered = this.untiered();
    const banned = this.banned();
    if (!tiers || !untiered) return;

    const NEW_TIER_PREFIX = '__NEW_TIER__';

    const lines = csvText
      .replace(/\r/g, '')
      .split('\n')
      .filter((l) => l.trim());

    // Build a flat lookup map: lowercase name -> TierPokemon
    const allPokemon = new Map<string, EditTierPokemon>();
    const allTiers = [...tiers, untiered, ...(banned ? [banned] : [])];
    for (const tier of allTiers) {
      for (const p of tier.pokemon) {
        allPokemon.set(p.name.toLowerCase(), p);
      }
    }

    // Resolve column mappings: NEW_TIER__ prefixed values become actual tier names
    const resolvedMapping: (string | null)[] = columnMapping.map((m) => {
      if (m === null) return null;
      if (m.startsWith(NEW_TIER_PREFIX)) return m.slice(NEW_TIER_PREFIX.length);
      return m;
    });

    // Collect new tier names that need to be created (preserve insertion order)
    const newTierNames: string[] = [];
    columnMapping.forEach((m) => {
      if (m !== null && m.startsWith(NEW_TIER_PREFIX)) {
        const name = m.slice(NEW_TIER_PREFIX.length);
        if (!newTierNames.includes(name)) newTierNames.push(name);
      }
    });

    // Build new tier buckets using resolved mapping
    const importedByTier = new Map<string, EditTierPokemon[]>();
    const assignedIds = new Set<string>();
    const unknownNames = new Set<string>();

    for (let col = 0; col < headers.length; col++) {
      const targetTier = resolvedMapping[col]; // null = excluded
      if (targetTier === null) continue;

      const bucket = importedByTier.get(targetTier) ?? [];
      for (let row = 1; row < lines.length; row++) {
        const cells = this.parseCsvRow(lines[row]);
        const cellValue = (cells[col] ?? '').trim();
        if (!cellValue) continue;
        const p = allPokemon.get(cellValue.toLowerCase());
        if (p && !assignedIds.has(p.id)) {
          bucket.push(p);
          assignedIds.add(p.id);
        } else if (!p) {
          unknownNames.add(cellValue);
        }
      }
      importedByTier.set(targetTier, bucket);
    }

    // Reassign existing tiers and append newly created tiers at the end
    const updatedTiers: EditableTier[] = tiers.map((tier) => ({
      ...tier,
      pokemon: importedByTier.get(tier.name) ?? [],
    }));

    for (const name of newTierNames) {
      updatedTiers.push({ name, pokemon: importedByTier.get(name) ?? [] });
    }

    const importedBanned = importedByTier.get(this.BANNED_TIER_NAME) ?? [];
    const importedUntiered = importedByTier.get(this.UNTIERED_TIER_NAME) ?? [];

    // Any pokemon not assigned by the mapping goes back to untiered
    const remainingPokemon = [
      ...importedUntiered,
      ...[...allPokemon.values()].filter((p) => !assignedIds.has(p.id)),
    ];

    const placedCount = assignedIds.size - importedUntiered.length;
    const tieredCount = resolvedMapping.filter(
      (t) => t !== null && t !== this.UNTIERED_TIER_NAME,
    ).length;

    this.tiers.set(updatedTiers);
    this.untiered.set({ ...untiered, pokemon: remainingPokemon });
    this.banned.set({ name: this.BANNED_TIER_NAME, pokemon: importedBanned });
    this.hasUnsavedChanges.set(true);

    const parts: string[] = [
      `${placedCount} Pokémon placed across ${tieredCount} tier(s).`,
    ];
    if (newTierNames.length > 0) {
      parts.push(
        `${newTierNames.length} new tier(s) created: ${newTierNames.join(', ')}.`,
      );
    }
    if (unknownNames.size > 0) {
      parts.push(`${unknownNames.size} unrecognized name(s) skipped.`);
    }
    this.snackBar.open(parts.join(' '), 'Close', { duration: 5000 });
  }

  openSettings(): void {
    this.tierListService
      .getSettings()
      .pipe(first())
      .subscribe((settings) => {
        const dialogRef = this.dialog.open(TierListSettingsDialogComponent, {
          data: settings satisfies TierListSettingsDialogData,
          width: '30rem',
          maxWidth: '95vw',
        });

        dialogRef
          .afterClosed()
          .pipe(first())
          .subscribe((result: TierListSettingsDialogData | undefined) => {
            if (!result) return;
            if (result.name) this.tierListName.set(result.name);
          });
      });
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
        notes: p.notes,
        bannedAbilities: p.banned?.abilities,
        formes: p.formes?.map((forme) => forme.id),
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
        notes: p.notes,
        bannedAbilities: p.banned?.abilities,
        formes: p.formes?.map((forme) => forme.id),
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

    this.tierListService
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
    return matchesSearchText(pokemon, this.searchText());
  }
}
