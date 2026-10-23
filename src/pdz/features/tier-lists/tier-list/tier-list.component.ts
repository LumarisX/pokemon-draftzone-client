import {
  afterRenderEffect,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { Router, RouterModule } from '@angular/router';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { ApiError, toApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { RoleService } from '@pdz/core/services/role.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import {
  StartTournamentData,
  StartTournamentDialogComponent,
} from '../start-tournament-dialog/start-tournament-dialog.component';
import { ExportList, TierListExportService } from '../tier-list-export.service';
import { tierListBase } from '../tier-list-links';
import {
  ShareDialogData,
  ShareDialogResult,
  TierListShareComponent,
} from '../tier-list-share/tier-list-share.component';
import { injectIsOrganizer } from '@pdz/features/league-zone/organizer-access';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { Type, TYPES } from '@pdz/shared/data';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  PokemonDialogButton,
  PokemonDialogComponent,
  PokemonDialogData,
} from '@pdz/shared/dialogs/pokemon-dialog/pokemon-dialog.component';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { LeagueTier, TierListMeta, TierPokemon } from '../tier-list.model';
import {
  DraftedPick,
  DraftedPools,
  TierListService,
} from '../tier-list.service';
import { SpriteState } from '@pdz/shared/images/sprite/sprite.component';
import {
  filterBySearch,
  makeBanString,
  SORT_MAP,
  SORT_OPTIONS,
  SortOption,
} from './tier-list.utils';

interface DraftPokemonAction {
  action: 'draft';
  teraCapt: boolean;
  pokemon: TierPokemon;
  tier: LeagueTier;
}

@Component({
  selector: 'pdz-tier-list',
  templateUrl: './tier-list.component.html',
  imports: [
    RouterModule,
    FormsModule,
    ChoiceDirective,
    TooltipDirective,
    ReactiveFormsModule,
    SkeletonLayoutComponent,
    SpriteComponent,
    IconComponent,
    PokemonTypeComponent,
    PokemonComponent,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    NgTemplateOutlet,
    PageComponent,
    PageHeaderComponent,
    ChipComponent,
    EmptyStateComponent,
  ],
  styleUrls: ['./tier-list.component.scss'],
})
export class TierListComponent implements OnInit, OnDestroy {
  private tierListService = inject(TierListService);
  private eventStream = inject(EventStreamService);
  private dialogs = inject(DialogService);
  private destroy$ = new Subject<void>();

  readonly header = input<string>();
  readonly showHeader = input(true, { transform: booleanAttribute });
  protected readonly isOrganizer = injectIsOrganizer();

  localDrafted = input<DraftedPick[]>([]);
  drafted = signal<DraftedPools['pools']>({});
  private sharedPools = new Set<string>();
  private coachedTeamIds = new Set<string>();
  tiers = signal<LeagueTier[] | undefined>(undefined);
  ruleset = signal<string | undefined>(undefined);
  format = signal<string | undefined>(undefined);
  meta = signal<TierListMeta | null>(null);
  loadError = signal<'missing' | 'error' | 'none' | null>(null);
  tierListName = signal<string>('Tier List');
  forking = signal(false);
  exporting = signal(false);

  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly exporter = inject(TierListExportService);
  private readonly league = inject(LeagueZoneService);
  protected readonly isAdmin = toSignal(inject(RoleService).isAdmin$, {
    initialValue: false,
  });
  protected readonly isAuthenticated = toSignal(
    inject(AuthService).isAuthenticated$,
    { initialValue: false },
  );
  protected readonly inTournament = !!this.league.tournamentSlug();
  protected readonly tierListPath = TIER_LIST_PATH;
  protected readonly links = computed(() => {
    const base = tierListBase(
      this.league,
      this.meta()?.slug ?? this.tierListService.tierListId(),
    );
    return {
      edit: [...base, 'edit'],
      history: [...base, 'history'],
      compare: [...base, 'compare'],
    };
  });
  protected readonly canEdit = computed(() => {
    const access = this.meta()?.access;
    return access === 'edit' || access === 'manage';
  });
  protected readonly canShare = computed(() => {
    const meta = this.meta();
    return !!meta && !meta.tournament && (meta.access === 'manage' || !!meta.role);
  });
  protected readonly headerDetail = computed(() => {
    const meta = this.meta();
    const parts: string[] = [];
    if (meta?.authorName && !meta.tournament) parts.push(`by ${meta.authorName}`);
    if (this.format()) parts.push(this.format()!);
    if (this.ruleset()) parts.push(this.ruleset()!);
    if (meta?.version) parts.push(`version ${meta.version}`);
    return parts.join(' · ');
  });

  private exportList(): ExportList {
    const tiers = this.tiers() ?? [];
    return {
      name: this.tierListName(),
      format: this.format(),
      ruleset: this.ruleset(),
      tiers: tiers
        .filter((tier) => tier.name !== 'Banned')
        .map((tier) => ({
          name: tier.name,
          cost: tier.cost,
          pokemon: tier.pokemon.map(({ id, name }) => ({ id, name })),
        })),
      banned: (tiers.find((tier) => tier.name === 'Banned')?.pokemon ?? []).map(
        ({ id, name }) => ({ id, name }),
      ),
    };
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv(this.exportList());
  }

  protected exportJson(): void {
    const slug = this.meta()?.slug;
    if (!slug) return;
    this.tierListService.exportJson(slug).subscribe({
      next: (data) => this.exporter.downloadJson(data, this.tierListName()),
      error: (err) =>
        this.toasts.error(apiErrorMessage(err, 'Could not export the tier list.')),
    });
  }

  protected async exportImage(): Promise<void> {
    this.exporting.set(true);
    try {
      await this.exporter.downloadImage(this.exportList());
    } catch {
      this.toasts.error('Could not draw the tier list image.');
    } finally {
      this.exporting.set(false);
    }
  }

  protected fork(): void {
    const slug = this.meta()?.slug;
    if (!slug || this.forking()) return;
    this.forking.set(true);
    this.tierListService.fork(slug).subscribe({
      next: (created) => {
        this.forking.set(false);
        this.toasts.success(`Created ${created.name}.`);
        this.router.navigate(['/', TIER_LIST_PATH, created.slug, 'edit']);
      },
      error: (err) => {
        this.forking.set(false);
        this.toasts.error(apiErrorMessage(err, 'Could not copy the tier list.'));
      },
    });
  }

  protected startTournament(): void {
    const slug = this.meta()?.slug;
    if (!slug) return;
    this.dialogs.open<StartTournamentDialogComponent, void, StartTournamentData>(
      StartTournamentDialogComponent,
      {
        heading: 'Start a Tournament',
        subheading: 'Pick the league to host it in.',
        size: 'sm',
        data: { slug, name: this.tierListName() },
      },
    );
  }

  protected async share(): Promise<void> {
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
    if (!result) return;
    if (result.left) {
      this.router.navigate(['/', TIER_LIST_PATH, 'mine']);
      return;
    }
    this.meta.set({ ...meta, visibility: result.visibility, authorName: result.authorName });
  }

  protected toggleFeatured(): void {
    const meta = this.meta();
    if (!meta) return;
    this.tierListService.setFeatured(meta.slug, !meta.featured).subscribe({
      next: ({ featured }) => {
        this.meta.set({ ...meta, featured });
        this.toasts.success(featured ? 'Featured.' : 'No longer featured.');
      },
      error: (err) => this.toasts.error(apiErrorMessage(err, 'Could not change that.')),
    });
  }
  sortBy = signal<SortOption>('BST');
  selectedPool = signal<string | undefined>(undefined);
  searchText = signal<string>('');
  selectedTypes = signal<Type[]>([]);
  filteredTypes = signal<Type[]>([...TYPES]);

  expandedTierName = signal<string | null>(null);

  private tiersContainer = viewChild<ElementRef<HTMLElement>>('tiersContainer');

  readonly SortOptions = SORT_OPTIONS;
  readonly types = TYPES;

  compact: boolean = false;

  readonly sortedTiers = computed(() => {
    const sortBy = this.sortBy();
    const tiers = this.tiers();
    if (!tiers) return null;

    return tiers.map((tier) => ({
      ...tier,
      pokemon: [...tier.pokemon].sort(SORT_MAP[sortBy]),
    }));
  });

  readonly displayedTiers = computed(() => {
    const tiers = this.sortedTiers();
    if (!tiers) return null;

    const expanded = this.expandedTierName();
    if (!expanded) return tiers;
    return tiers.filter((tier) => tier.name === expanded);
  });

  readonly draftedBy = computed(() => {
    const selectedPool = this.selectedPool();
    const server = selectedPool ? (this.drafted()[selectedPool] ?? []) : [];
    return new Map(
      [...server, ...this.localDrafted()].map((pick) => [pick.pokemonId, pick]),
    );
  });

  private readonly filterMenu = viewChild<MenuComponent>('filterMenu');

  readonly hiddenTypeCount = computed(
    () => this.types.length - this.filteredTypes().length,
  );

  get poolNames() {
    return Object.keys(this.drafted());
  }

  typeInFilter = (pokemon: TierPokemon) =>
    filterBySearch(pokemon, this.filteredTypes(), this.searchText());

  makeBanString = makeBanString;

  private spriteCache = new WeakMap<
    TierPokemon,
    { formes: TierPokemon['formes']; ref: TierPokemon }
  >();

  spriteFor(pokemon: TierPokemon): TierPokemon {
    if (!pokemon.formes?.length) return pokemon;
    const cached = this.spriteCache.get(pokemon);
    if (cached && cached.formes === pokemon.formes) return cached.ref;
    const ref = { ...pokemon, draftFormes: pokemon.formes };
    this.spriteCache.set(pokemon, { formes: pokemon.formes, ref });
    return ref;
  }

  constructor() {
    effect(() => {
      if (!this.filterMenu()?.isOpen()) return;
      this.selectedTypes.set([...untracked(this.filteredTypes)]);
    });
    afterRenderEffect(() => {
      this.searchText();
      this.filteredTypes();
      this.snapToVisibleResult();
    });
  }

  private snapToVisibleResult(): void {
    const container = this.tiersContainer()?.nativeElement;
    if (!container) return;

    const tiersWithResults = Array.from(
      container.querySelectorAll<HTMLElement>('.tier'),
    ).filter((tier) => tier.querySelector('.pokemon-entry'));
    if (tiersWithResults.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const inView = tiersWithResults.some((tier) => {
      const rect = tier.getBoundingClientRect();
      return rect.left < containerRect.right && rect.right > containerRect.left;
    });
    if (inView) return;

    let nearest = tiersWithResults[0];
    let bestDistance = Infinity;
    for (const tier of tiersWithResults) {
      const rect = tier.getBoundingClientRect();
      const distance =
        rect.left >= containerRect.right
          ? rect.left - containerRect.right
          : containerRect.left - rect.right;
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = tier;
      }
    }
    nearest.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }

  ngOnInit(): void {
    this.loadTierList();
    this.subscribeToLiveUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadTierList(): void {
    this.loadError.set(null);
    this.tierListService
      .getTierList()
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.tiers.set(data.tierList);
          this.ruleset.set(data.ruleset);
          this.format.set(data.format);
          this.meta.set(data.meta ?? null);
          if (data.name) this.tierListName.set(data.name);
        },
        error: (err) => {
          const status = toApiError(err)?.status;
          this.loadError.set(
            status === 404 ? 'missing' : err instanceof ApiError ? 'error' : 'none',
          );
        },
      });

    this.tierListService
      .getDraftedByPool()
      .pipe(first())
      .subscribe(({ pools, selected, sharedPools, coachedTeamIds }) => {
        this.drafted.set(pools);
        this.sharedPools = new Set(sharedPools);
        this.coachedTeamIds = new Set(coachedTeamIds);
        if (selected) this.selectedPool.set(selected);
      });
  }

  private subscribeToLiveUpdates(): void {
    this.eventStream
      .on<{
        pick: {
          pool: string;
          pokemon?: League.LeaguePokemon;
          team: { id: string; name: string };
        };
        team: {
          id: string;
          name: string;
          draft: League.LeaguePokemon[];
        };
        canDraftTeams: string[];
      }>('league.draft.added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const pokemon = data.pick.pokemon;
        if (!pokemon) return;
        const pool = data.pick.pool;
        if (
          this.sharedPools.has(pool) &&
          !this.coachedTeamIds.has(data.pick.team.id)
        )
          return;

        const currentDrafted = this.drafted();
        const team = data.pick.team;
        const teamLogo = Object.values(currentDrafted)
          .flat()
          .find((pick) => pick.teamId === team.id)?.teamLogo;
        this.drafted.set({
          ...currentDrafted,
          [pool]: [
            ...(currentDrafted[pool] ?? []),
            {
              pokemonId: pokemon.id,
              teamId: team.id,
              teamName: team.name,
              teamLogo,
            },
          ],
        });
      });
  }

  updateFilter(selected: boolean, index?: number): void {
    if (index === undefined) {
      if (selected) {
        this.selectedTypes.set([...this.types]);
      } else {
        this.selectedTypes.set([]);
      }
      return;
    }
    if (selected) {
      this.selectedTypes.update((types) => [...types, this.types[index]]);
    } else {
      this.selectedTypes.update((types) =>
        types.filter((type) => type !== this.types[index]),
      );
    }
  }

  applyFilter(): void {
    this.filteredTypes.set([...this.selectedTypes()]);
    this.filterMenu()?.close();
  }

  readonly buttonText = input<string>();

  readonly altButtonText = input<string>();

  @Output() pokemonSelected = new EventEmitter<{
    id: string;
    name: string;
    addons?: string[];
    tier: string;
    cost?: number;
  }>();

  showDrafted: boolean = true;

  async openPokemonDetails(
    pokemon: TierPokemon,
    tier: LeagueTier,
  ): Promise<void> {
    const displayedTiers = this.displayedTiers();
    if (!displayedTiers) return;

    const flatList: { pokemon: TierPokemon; tier: LeagueTier }[] = [];
    for (const t of displayedTiers) {
      for (const p of this.getVisiblePokemon(t)) {
        flatList.push({ pokemon: p, tier: t });
      }
    }

    const dataList = flatList.map(({ pokemon: p, tier: t }) =>
      this.buildPokemonDialogData(p, t),
    );
    dataList.forEach((d, i) => {
      if (i > 0) d.prev = dataList[i - 1];
      if (i < dataList.length - 1) d.next = dataList[i + 1];
    });

    const idx = flatList.findIndex((item) => item.pokemon.id === pokemon.id);
    const dialogData =
      idx >= 0 ? dataList[idx] : this.buildPokemonDialogData(pokemon, tier);

    const result = await this.dialogs.open<
      PokemonDialogComponent,
      DraftPokemonAction,
      PokemonDialogData
    >(PokemonDialogComponent, { size: 'md', data: dialogData }).closed;

    if (result?.action !== 'draft') return;

    const { pokemon: picked, tier: pickedTier, teraCapt } = result;
    const emit: {
      id: string;
      name: string;
      addons?: string[];
      tier: string;
      cost?: number;
    } = {
      id: picked.id,
      name: picked.name,
      tier: pickedTier.name,
      cost: pickedTier.cost,
    };
    if (teraCapt) {
      emit.cost = picked.addons![0].cost;
      emit.addons = ['Tera Captain'];
    }
    this.pokemonSelected.emit(emit);
  }

  private buildPokemonDialogData(
    pokemon: TierPokemon,
    tier: LeagueTier,
  ): PokemonDialogData {
    const isDrafted = this.isPokemonDrafted(pokemon) || this.isBanTier(tier);
    const buttons: PokemonDialogButton[] = [];
    const buttonText = this.buttonText();
    if (buttonText && tier.cost != null) {
      buttons.push({
        label: buttonText,
        result: { action: 'draft', teraCapt: false, pokemon, tier },
        variant: 'primary',
        disabled: isDrafted,
      });
    }
    const altButtonText = this.altButtonText();
    if (altButtonText && pokemon.addons?.length) {
      buttons.push({
        label: altButtonText,
        result: { action: 'draft', teraCapt: true, pokemon, tier },
        variant: 'secondary',
        disabled: isDrafted,
      });
    }
    return {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types,
        abilities: pokemon.abilities,
        stats: pokemon.stats,
        bst: pokemon.bst,
        cst: pokemon.bst,
        banned: pokemon.banned,
        addons: pokemon.addons,
      },
      tier: { name: tier.name, cost: tier.cost },
      isDrafted,
      buttons,
      rulesetId: this.ruleset(),
    };
  }

  getVisiblePokemon(tier: LeagueTier): TierPokemon[] {
    return tier.pokemon.filter(
      (p) =>
        this.typeInFilter(p) && (this.showDrafted || !this.isPokemonDrafted(p)),
    );
  }

  isPokemonDrafted(pokemon: Pokemon): boolean {
    return this.draftedBy().has(pokemon.id);
  }

  draftPick(pokemon: Pokemon): DraftedPick | undefined {
    return this.draftedBy().get(pokemon.id);
  }

  spriteState(pokemon: Pokemon): SpriteState | null {
    return this.isPokemonDrafted(pokemon) ? 'taken' : null;
  }

  takenLogo(pokemon: Pokemon): string | undefined {
    return getTeamLogoSrc(this.draftPick(pokemon)?.teamLogo);
  }

  isBanTier(tier: LeagueTier): boolean {
    return tier.name === 'Ban' || tier.name === 'Banned';
  }

  isTierExpanded(tier: LeagueTier): boolean {
    return this.expandedTierName() === tier.name;
  }

  toggleTierExpanded(tier: LeagueTier): void {
    this.expandedTierName.update((name) =>
      name === tier.name ? null : tier.name,
    );
  }

  makeWarningString(pokemon: TierPokemon) {
    let warningString = makeBanString(pokemon.banned);
    if (pokemon.notes) {
      if (warningString) warningString += ' ';
      warningString += `Note: ${pokemon.notes}`;
    }
    return warningString;
  }
}
