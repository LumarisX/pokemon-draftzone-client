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
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { TierListMeta, TierPokemon } from '@pdz/features/tier-lists/tier-list.model';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import {
  ExportList,
  TierListExportService,
} from '@pdz/features/tier-lists/tier-list-export.service';
import {
  LegalityDialogData,
  TierListLegalityComponent,
} from '@pdz/features/tier-lists/tier-list-legality/tier-list-legality.component';
import { tierListBase } from '@pdz/features/tier-lists/tier-list-links';
import {
  ShareDialogData,
  ShareDialogResult,
  TierListShareComponent,
} from '@pdz/features/tier-lists/tier-list-share/tier-list-share.component';
import {
  TierListSettingsDialogComponent,
  TierListSettingsDialogData,
} from '../tier-list-settings-dialog/tier-list-settings-dialog.component';
import { matchesSearchText, SORT_MAP, SortOption } from '../tier-list.utils';
import {
  PokemonEditDialogComponent,
  PokemonEditDialogData,
  PokemonEditDialogResult,
} from './pokemon-edit-dialog/pokemon-edit-dialog.component';
import {
  TierDialogData,
  TierDialogResult,
  TierEditDialogComponent,
} from './tier-edit-dialog/tier-edit-dialog.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

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
  id?: string;
  name: string;
  cost?: number;
  pokemon: EditTierPokemon[];
}

@Component({
  selector: 'pdz-tier-list-form',
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    TooltipDirective,
    ReactiveFormsModule,
    SpriteComponent,
    SkeletonLayoutComponent,
    IconComponent,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './tier-list-form.component.html',
  styleUrls: ['./tier-list-form.component.scss'],
})
export class TierListFormComponent implements OnInit, OnDestroy {
  private tierListService = inject(TierListService);
  private dialogs = inject(DialogService);
  private toasts = inject(ToastService);
  private destroy$ = new Subject<void>();

  tiers = signal<EditableTier[] | undefined>(undefined);
  untiered = signal<EditableTier | undefined>(undefined);
  sortBy = signal<SortOption>('BST');
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);
  tierListName = signal<string>('Tier List');
  ruleset = signal<string | undefined>(undefined);
  meta = signal<TierListMeta | null>(null);
  loadFailed = signal(false);
  logNote = signal('');

  private readonly router = inject(Router);
  private readonly exporter = inject(TierListExportService);
  private readonly league = inject(LeagueZoneService);
  readonly isTournamentCopy = computed(() => !!this.meta()?.tournament);
  readonly canShare = computed(() => {
    const meta = this.meta();
    return !!meta && !meta.tournament && (meta.access === 'manage' || !!meta.role);
  });
  readonly base = computed(() =>
    tierListBase(this.league, this.meta()?.slug ?? this.tierListService.tierListId()),
  );
  readonly viewLink = computed(() => this.base());
  readonly historyLink = computed(() => [...this.base(), 'history']);

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

  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private savedHistoryDepth = 0;
  readonly MAX_HISTORY = 50;
  canUndo = signal(false);
  canRedo = signal(false);

  flashedPokemonIds = signal<Set<string>>(new Set());
  private flashTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  selectedPokemonIds = signal<Set<string>>(new Set());
  lastSelectedPokemon: { pokemon: EditTierPokemon; tier: EditableTier } | null =
    null;
  isDragging = signal<boolean>(false);

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

  loadTierList(): void {
    this.isLoading.set(true);
    this.tierListService
      .getTierListEdit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data.name) this.tierListName.set(data.name);
          this.ruleset.set(data.ruleset);
          this.meta.set(data.meta ?? null);
          this.loadFailed.set(false);
          const flatTiers = [...data.tierList];

          const nullTierIndex = flatTiers.findIndex(
            (tier) =>
              tier.name.toLowerCase() === this.UNTIERED_TIER_NAME.toLowerCase(),
          );

          const untieredTier: EditableTier =
            nullTierIndex !== -1
              ? (flatTiers.splice(nullTierIndex, 1)[0] as EditableTier)
              : { name: this.UNTIERED_TIER_NAME, pokemon: [] };

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
        error: () => {
          this.isLoading.set(false);
          this.loadFailed.set(true);
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

    if (this.isDragging()) {
      return;
    }

    const selectedIds = this.selectedPokemonIds();

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
    if (start.tier === end.tier) {
      const startIdx = start.tier.pokemon.indexOf(start.pokemon);
      const endIdx = end.tier.pokemon.indexOf(end.pokemon);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      return start.tier.pokemon.slice(minIdx, maxIdx + 1).map((p) => p.id);
    }

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

    allTiers.forEach((tier) => {
      tier.pokemon = tier.pokemon.filter((p) => !selectedIds.has(p.id));
    });

    targetTier.pokemon.push(...moves.map((m) => m.pokemon));
    targetTier.pokemon.sort(SORT_MAP[sortBy]);

    this.flashPokemon(moves.map((m) => m.pokemon.id));
    this.clearSelection();
    this.hasUnsavedChanges.set(true);
    this.toasts.success(`Moved ${moves.length} Pokémon`, { duration: 2000 });
  }

  private async openPokemonDialog(
    pokemon: EditTierPokemon,
    tier: EditableTier,
  ): Promise<void> {
    const result = await this.dialogs.open<
      PokemonEditDialogComponent,
      PokemonEditDialogResult,
      PokemonEditDialogData
    >(PokemonEditDialogComponent, {
      heading: `Edit ${pokemon.name}`,
      size: 'md',
      data: {
        pokemon,
        currentTier: tier,
        tiers: this.tiers() ?? [],
        ruleset: this.ruleset(),
      },
    }).closed;

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
        nextBanned.moves?.length || nextBanned.tera ? nextBanned : undefined;
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
      this.untiered() ? { ...(this.untiered() as EditableTier) } : undefined,
    );
    this.hasUnsavedChanges.set(true);
    this.toasts.success('Pokémon updated', { duration: 2000 });
  }

  moveTier(fromIndex: number, toIndex: number): void {
    const tiers = this.tiers();
    if (!tiers || toIndex < 0 || toIndex >= tiers.length) return;
    const [tier] = tiers.splice(fromIndex, 1);
    tiers.splice(toIndex, 0, tier);
    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
  }

  async addNewTier(): Promise<void> {
    const tiers = this.tiers();
    if (!tiers) return;

    const result = await this.openTierDialog('Add New Tier', {});
    if (!result) return;

    tiers.push({
      name: result.name,
      cost: result.cost,
      pokemon: [],
    });

    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
    this.toasts.success(`Tier "${result.name}" added`, { duration: 2000 });
  }

  async editTier(tier: EditableTier): Promise<void> {
    const result = await this.openTierDialog('Edit Tier', { tier });
    if (!result) return;

    tier.name = result.name;
    tier.cost = result.cost;
    this.hasUnsavedChanges.set(true);
    this.toasts.success('Tier updated', { duration: 2000 });
  }

  private openTierDialog(
    heading: string,
    data: TierDialogData,
  ): Promise<TierDialogResult | undefined> {
    return this.dialogs.open<
      TierEditDialogComponent,
      TierDialogResult,
      TierDialogData
    >(TierEditDialogComponent, { heading, size: 'sm', data }).closed;
  }

  async deleteTier(tierIndex: number): Promise<void> {
    const tiers = this.tiers();
    if (!tiers) return;

    const tier = tiers[tierIndex];
    if (tier.pokemon.length > 0) {
      const confirmed = await this.dialogs.confirm(`Delete "${tier.name}"?`, {
        message: `Its ${tier.pokemon.length} Pokémon will be removed from the tier list too.`,
        confirmLabel: 'Delete Tier',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
    }

    tiers.splice(tierIndex, 1);

    this.tiers.set([...tiers]);
    this.hasUnsavedChanges.set(true);
    this.toasts.success(`Tier "${tier.name}" deleted`, { duration: 2000 });
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

  private exportList(): ExportList {
    return {
      name: this.tierListName(),
      ruleset: this.ruleset(),
      tiers: (this.tiers() ?? []).map((tier) => ({
        name: tier.name,
        cost: tier.cost,
        pokemon: tier.pokemon.map(({ id, name }) => ({ id, name })),
      })),
      banned: (this.banned()?.pokemon ?? []).map(({ id, name }) => ({ id, name })),
    };
  }

  exportCsv(): void {
    this.exporter.downloadCsv(this.exportList());
  }

  async exportImage(): Promise<void> {
    try {
      await this.exporter.downloadImage(this.exportList());
    } catch {
      this.toasts.error('Could not draw the tier list image.');
    }
  }

  async openImport(): Promise<void> {
    if (this.hasUnsavedChanges()) {
      const leave = await this.dialogs.confirm('Save before importing?', {
        message: 'Importing starts from the saved list. Unsaved changes here will be lost.',
        confirmLabel: 'Continue Without Saving',
        confirmColor: 'danger',
      });
      if (!leave) return;
      this.hasUnsavedChanges.set(false);
    }
    this.router.navigate([...this.base(), 'import']);
  }

  openLegality(): void {
    const slug = this.meta()?.slug;
    if (!slug) return;
    this.dialogs.open<TierListLegalityComponent, void, LegalityDialogData>(
      TierListLegalityComponent,
      {
        heading: 'Legality Check',
        subheading: this.hasUnsavedChanges()
          ? 'Checks the saved list. Save first to include your changes.'
          : `Against ${this.ruleset() ?? 'its ruleset'}`,
        size: 'md',
        data: { slug },
      },
    );
  }

  async share(): Promise<void> {
    const meta = this.meta();
    if (!meta) return;
    const result = await this.dialogs.open<
      TierListShareComponent,
      ShareDialogResult,
      ShareDialogData
    >(TierListShareComponent, {
      heading: 'Share',
      subheading: this.tierListName(),
      size: 'md',
      data: {
        slug: meta.slug,
        name: this.tierListName(),
        visibility: meta.visibility,
        authorName: meta.authorName,
        canManage: meta.access === 'manage',
      },
    }).closed;
    if (result && !result.left)
      this.meta.set({ ...meta, visibility: result.visibility, authorName: result.authorName });
  }

  openSettings(): void {
    this.tierListService
      .getSettings()
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(async (settings) => {
        const result = await this.dialogs.open<
          TierListSettingsDialogComponent,
          TierListSettingsDialogData,
          TierListSettingsDialogData
        >(TierListSettingsDialogComponent, {
          heading: 'Tier List Settings',
          size: 'md',
          data: settings,
        }).closed;

        if (!result) return;
        this.tierListName.set(result.name);
        const rulesChanged =
          result.ruleset !== settings.ruleset || result.format !== settings.format;
        if (rulesChanged && !this.hasUnsavedChanges()) this.loadTierList();
        else if (rulesChanged)
          this.toasts.show({
            title: 'Ruleset Changed',
            message: 'Save your changes, then reload to see Pokémon from the new ruleset.',
            tone: 'info',
          });
      });
  }

  saveTierList(): void {
    this.isLoading.set(true);

    const tiers = this.tiers();
    const nullTier = this.untiered();
    if (!tiers) {
      this.isLoading.set(false);
      this.toasts.error('No tier data to save');
      return;
    }

    const allTiers = [...tiers];
    if (nullTier) allTiers.push(nullTier);

    const tierData = allTiers.map((tier) => ({
      id: tier.id,
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
          id: undefined,
          name: this.UNTIERED_TIER_NAME,
          cost: 0,
          pokemon: bannedPayload,
        });
      }
    }

    const meta = this.meta();
    this.tierListService
      .saveTierListEdit(
        tierData,
        {
          ...(meta && { version: meta.version }),
          ...(this.logNote().trim() && { reason: this.logNote().trim() }),
        },
        meta?.slug,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.savedHistoryDepth = this.undoStack.length;
          this.hasUnsavedChanges.set(false);
          this.logNote.set('');
          if (meta) this.meta.set({ ...meta, version: response.version });
          const orphaned = response.orphanedRequirements?.reduce(
            (sum, entry) => sum + entry.requirements,
            0,
          );
          if (orphaned)
            this.toasts.show({
              title: 'Saved',
              message: `${orphaned} tier requirement${orphaned === 1 ? '' : 's'} pointed at a tier you deleted. Review them in the tournament's settings.`,
              tone: 'warning',
            });
          else this.toasts.success(response.summary ? `Saved: ${response.summary}` : 'Saved.');
        },
        error: (err) => {
          this.isLoading.set(false);
          if (toApiError(err)?.code === 'LR-TIER-005') {
            this.handleStale();
            return;
          }
          this.toasts.error(
            apiErrorMessage(err, 'Could not save the tier list.'),
          );
        },
      });
  }

  private async handleStale(): Promise<void> {
    const reload = await this.dialogs.confirm('Someone else saved this list', {
      message:
        'They saved after you opened it. Reload to see their version, or keep editing and copy your changes over by hand. Your unsaved changes are lost if you reload.',
      confirmLabel: 'Reload',
      cancelLabel: 'Keep Editing',
      confirmColor: 'danger',
    });
    if (reload) this.loadTierList();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) return true;
    return this.dialogs.confirm('Leave without saving?', {
      message: 'Your tier list changes have not been saved.',
      confirmLabel: 'Leave',
      confirmColor: 'danger',
    });
  }

  isSortingDisabled(_tier: EditableTier): boolean {
    return this.searchText().length > 0;
  }

  filterPokemon(pokemon: EditTierPokemon): boolean {
    return matchesSearchText(pokemon, this.searchText());
  }
}
