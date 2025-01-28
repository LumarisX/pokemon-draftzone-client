import { CommonModule } from '@angular/common';
import { Component, effect, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { RouterModule } from '@angular/router';
import { TierPokemon } from '.';
import { BattleZoneService } from '../../api/battle-zone.service';
import { Type, TYPES } from '../../data';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { filter } from 'd3';

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
    ReactiveFormsModule,
    SpriteComponent,
    LoadingComponent,
  ],
  styleUrl: './tier-list.component.scss',
})
export class BZTierListComponent implements OnInit {
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

  types = TYPES;

  selectedTypes: Type[] = [];
  filteredTypes: Type[] = [...this.types];

  tiers?: {
    name: string;
    pokemon: TierPokemon[];
  }[];

  updatedTime?: string;
  sortBy = signal<(typeof this.SortOptions)[number]>('BST');
  _menu: 'sort' | 'filter' | null = null;

  set menu(value: 'sort' | 'filter' | null) {
    if (value === 'filter') {
      this.selectedTypes = [...this.filteredTypes];
    }
    this._menu = value;
  }

  get menu() {
    return this._menu;
  }

  constructor(private battlezoneService: BattleZoneService) {
    effect(() => {
      this.sortTiers(this.sortBy());
      this.menu = null;
    });
  }

  ngOnInit(): void {
    this.refreshTiers();
  }

  refreshTiers() {
    this.tiers = undefined;
    this.sortBy.set('BST');
    this.battlezoneService.getTiers().subscribe((response) => {
      this.updatedTime = new Date(Date.now()).toLocaleTimeString();
      this.tiers = response;
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
    this.tiers = this.tiers?.map((tier) => ({
      name: tier.name,
      pokemon: tier.pokemon.sort(sortMap[value]),
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
      this.selectedTypes.filter((type) => type != type);
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
}
