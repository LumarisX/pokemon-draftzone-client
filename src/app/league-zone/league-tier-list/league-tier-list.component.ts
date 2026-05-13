import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { Type, TYPES } from '../../data';
import { IconComponent } from '../../images/icon/icon.component';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/pokemon';
import {
  LeagueTier,
  TierPokemon,
} from '../../interfaces/tier-pokemon.interface';
import { League } from '../../league-zone/league.interface';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { WebSocketService } from '../../services/ws.service';
import { typeColor } from '../../util/styling';
import {
  makeBanString,
  SORT_MAP,
  SORT_OPTIONS,
  SortOption,
  filterBySearch,
} from './tier-list.utils';
import {
  PokemonDetailDialogComponent,
  PokemonDetailDialogResult,
} from './pokemon-detail-dialog/pokemon-detail-dialog.component';

@Component({
  selector: 'pdz-league-tier-list',
  standalone: true,
  templateUrl: './league-tier-list.component.html',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule,
    FormsModule,
    MatCheckboxModule,
    MatTooltipModule,
    ReactiveFormsModule,
    LoadingComponent,
    SpriteComponent,
    IconComponent,
  ],
  styleUrls: ['./league-tier-list.component.scss'],
})
export class LeagueTierListComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private wsService = inject(WebSocketService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  drafted = signal<{ [division: string]: { pokemonId: string }[] }>({});
  tiers = signal<LeagueTier[] | undefined>(undefined);
  sortBy = signal<SortOption>('BST');
  selectedDivision = signal<string | undefined>(undefined);
  searchText = signal<string>('');
  selectedTypes = signal<Type[]>([]);
  filteredTypes = signal<Type[]>([...TYPES]);

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

  readonly draftedPokemonIds = computed(() => {
    const selectedDivision = this.selectedDivision();
    if (!selectedDivision) return new Set<string>();
    const drafted = this.drafted();
    return new Set(drafted[selectedDivision]?.map((p) => p.pokemonId) || []);
  });

  _menu: 'sort' | 'filter' | 'division' | null = null;

  set menu(value: 'sort' | 'filter' | 'division' | null) {
    if (value === 'filter') {
      this.selectedTypes.set([...this.filteredTypes()]);
    }
    this._menu = value;
  }

  get menu() {
    return this._menu;
  }

  get divisionNames() {
    return Object.keys(this.drafted());
  }

  typeInFilter = (pokemon: TierPokemon) =>
    filterBySearch(pokemon, this.filteredTypes(), this.searchText());

  makeBanString = makeBanString;

  constructor() {
    effect(() => {
      this.selectedDivision();
      this.menu = null;
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

  private loadTierList(): void {
    this.leagueService
      .getTierList()
      .pipe(first())
      .subscribe((data) => {
        this.drafted.set(data.divisions);
        this.tiers.set(data.tierList);
        const divisionNames = Object.keys(data.divisions);
        if (divisionNames.length > 0) {
          this.selectedDivision.set(divisionNames[0]);
        }
      });
  }

  private subscribeToLiveUpdates(): void {
    this.wsService
      .on<{
        pick: {
          division: string;
          pokemon: League.LeaguePokemon;
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
        const currentDrafted = this.drafted();
        if (currentDrafted[data.pick.division]) {
          const updatedDivisionDrafts = [
            ...currentDrafted[data.pick.division],
            { pokemonId: data.pick.pokemon.id },
          ];

          this.drafted.set({
            ...currentDrafted,
            [data.pick.division]: updatedDivisionDrafts,
          });
        }
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
    this.menu = null;
  }

  @Input()
  buttonText?: string;

  @Input()
  altButtonText?: string;

  @Output() pokemonSelected = new EventEmitter<{
    id: string;
    name: string;
    addons?: string[];
    tier: string;
    cost?: number;
  }>();

  showDrafted: boolean = true;
  typeColor = typeColor;

  openPokemonDetails(pokemon: TierPokemon, tier: LeagueTier): void {
    const dialogRef = this.dialog.open(PokemonDetailDialogComponent, {
      data: {
        pokemon: { ...pokemon, tier },
        isDrafted: this.isPokemonDrafted(pokemon) || tier.name === 'Ban',
        buttonText: this.buttonText,
        altButtonText: this.altButtonText,
      },
      maxWidth: '420px',
      width: '92vw',
      panelClass: 'pokemon-detail-panel',
    });

    dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe((result: PokemonDetailDialogResult) => {
        if (!result || result.action !== 'draft') return;
        const emit: {
          id: string;
          name: string;
          addons?: string[];
          tier: string;
          cost?: number;
        } = {
          id: pokemon.id,
          name: pokemon.name,
          tier: tier.name,
          cost: tier.cost,
        };
        if (result.teraCapt) {
          emit.cost = pokemon.addons![0].cost;
          emit.addons = ['Tera Captain'];
        }
        this.pokemonSelected.emit(emit);
      });
  }

  getVisiblePokemon(tier: LeagueTier): TierPokemon[] {
    return tier.pokemon.filter(
      (p) =>
        this.typeInFilter(p) && (this.showDrafted || !this.isPokemonDrafted(p)),
    );
  }

  isPokemonDrafted(pokemon: Pokemon): boolean {
    return this.draftedPokemonIds().has(pokemon.id);
  }
}
