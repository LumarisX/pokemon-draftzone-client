import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Type, TYPES } from '../../data';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { LeagueZoneService } from '../../services/league-zone.service';
import { typeColor } from '../../util/styling';
import { TierPokemon } from './league-tier-old';

@Component({
  selector: 'pdz-league-tier-list',
  imports: [
    CommonModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    RouterModule,
    FormsModule,
    MatCheckboxModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SpriteComponent,
    LoadingComponent,
  ],
  templateUrl: './league-tier-list.component.html',
  styleUrl: './league-tier-list.component.scss',
})
export class LeagueTierListComponent implements OnInit {
  private battlezoneService = inject(LeagueZoneService);
  private elRef = inject(ElementRef);

  readonly SortOptions = [
    'Name',
    'BST',
    'HP',
    'ATK',
    'DEF',
    'SPA',
    'SPD',
    'SPE',
  ] as const;

  readonly Divisions = ['Attack', 'Defense'] as const;

  types = TYPES;

  selectedTypes: Type[] = [];
  filteredTypes: Type[] = [...this.types];

  tierGroups?: {
    label?: string;
    tiers: {
      name: string;
      pokemon: TierPokemon[];
    }[];
  }[];

  updatedTime?: string;
  sortBy = signal<(typeof this.SortOptions)[number]>('BST');
  selectedDivision = new FormControl<string>(this.Divisions[0]);

  _menu: 'sort' | 'filter' | 'division' | null = null;

  set menu(value: 'sort' | 'filter' | 'division' | null) {
    if (value === 'filter') {
      this.selectedTypes = [...this.filteredTypes];
    }
    this._menu = value;
  }

  get menu() {
    return this._menu;
  }

  constructor() {
    effect(() => {
      this.sortTiers(this.sortBy());
      this.menu = null;
    });
    this.selectedDivision.valueChanges.subscribe(() => {
      this.menu = null;
    });
  }

  ngOnInit(): void {
    this.refreshTiers();
  }

  refreshTiers() {
    this.tierGroups = undefined;
    this.sortBy.set('BST');
    this.battlezoneService.getTiers().subscribe((response) => {
      this.updatedTime = new Date(Date.now()).toLocaleTimeString();
      this.tierGroups = response;
    });
  }

  sortTiers(value: (typeof this.SortOptions)[number]) {
    const sortMap: Record<
      (typeof this.SortOptions)[number],
      (x: TierPokemon, y: TierPokemon) => number
    > = {
      BST: (x, y) => y.bst - x.bst,
      HP: (x, y) => y.stats.hp - x.stats.hp,
      ATK: (x, y) => y.stats.atk - x.stats.atk,
      DEF: (x, y) => y.stats.def - x.stats.def,
      SPA: (x, y) => y.stats.spa - x.stats.spa,
      SPD: (x, y) => y.stats.spd - x.stats.spd,
      SPE: (x, y) => y.stats.spe - x.stats.spe,
      Name: (x, y) => x.id.localeCompare(y.id),
    };
    this.tierGroups = this.tierGroups?.map((group) => ({
      teraCount: group.label,
      tiers: group.tiers.map((tier) => ({
        name: tier.name,
        pokemon: tier.pokemon.sort(sortMap[value]),
      })),
    }));
  }

  updateFilter(selected: boolean, index?: number) {
    if (index === undefined) {
      if (selected) {
        this.selectedTypes = [...this.types];
      } else {
        this.selectedTypes = [];
      }
      return;
    }
    if (selected) {
      this.selectedTypes.push(this.types[index]);
    } else {
      this.selectedTypes = this.selectedTypes.filter(
        (type) => type !== this.types[index],
      );
    }
  }

  applyFilter() {
    this.filteredTypes = [...this.selectedTypes];
    this.menu = null;
  }

  typeInFilter(pokemon: TierPokemon): boolean {
    if (this.filteredTypes.length === 0) return true;
    return pokemon.types.some((type) => this.filteredTypes.includes(type));
  }

  makeBanString(banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  }): string {
    if (!banned) return '';
    const bans: string[] = [];
    if (banned.tera) bans.push('Terastalization');
    if (banned.abilities && banned.abilities.length > 0)
      bans.push(...banned.abilities);
    if (banned.moves && banned.moves.length > 0) bans.push(...banned.moves);
    return 'Banned: ' + bans.join(', ');
  }

  cardPosition = { top: '0px', left: '0px' };
  selectedPokemon: (TierPokemon & { tier: string }) | null = null;

  typeColor = typeColor;

  selectPokemon(pokemon: TierPokemon, tier: string, event: MouseEvent) {
    if (this.selectedPokemon === pokemon) {
      this.selectedPokemon = null;
      return;
    }
    this.selectedPokemon = { ...pokemon, tier };

    const clickedElement = event.currentTarget as HTMLElement;
    const componentRect = this.elRef.nativeElement.getBoundingClientRect();
    const clickedRect = clickedElement.getBoundingClientRect();

    const top =
      clickedRect.top - componentRect.top + clickedElement.offsetHeight / 2;
    const left =
      clickedRect.left - componentRect.left + clickedElement.offsetWidth;

    this.cardPosition = {
      top: `${top}px`,
      left: `${left + 10}px`,
    };
  }
}
