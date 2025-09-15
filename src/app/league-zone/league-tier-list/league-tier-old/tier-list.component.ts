import { TierPokemon } from '.';
import { Type, TYPES } from '../../../data';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WebSocketService } from '../../../services/ws.service';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { RouterModule } from '@angular/router';
import { LeagueZoneService } from '../../../services/league-zone.service';

interface TierGroup {
  label?: string;
  tiers: {
    name: string;
    pokemon: TierPokemon[];
  }[];
}

@Component({
  selector: 'bz-tier-list',
  standalone: true,
  templateUrl: './tier-list.component.html',
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
  styleUrl: './tier-list.component.scss',
})
export class BZTierListComponent implements OnInit {
  private wsService = inject(WebSocketService);
  private leagueService = inject(LeagueZoneService);

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

  tierGroups?: TierGroup[]; // Changed type to use the new interface

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
    this.leagueService
      .getTierList('pdbls2')
      .pipe(first())
      .subscribe((list) => {
        this.tierGroups = list;
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
}
