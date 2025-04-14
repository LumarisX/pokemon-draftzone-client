import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, effect, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BattleZoneService } from '../../../api/battle-zone.service';
import { TierPokemon } from '../../../battle-zone/tier-list';
import { Type, TYPES } from '../../../data';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';

type EditTierPokemon = TierPokemon & {
  orgTier?: CdkDragDrop<
    { name: string; pokemon: EditTierPokemon[] },
    { name: string; pokemon: EditTierPokemon[] },
    any
  >[];
  selected?: boolean;
};

@Component({
  selector: 'app-league-tier-list-form',
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
    DragDropModule,
  ],
  templateUrl: './league-tier-list-form.component.html',
  styleUrls: ['../tier-list.scss', './league-tier-list-form.component.scss'],
})
export class LeagueTierListFormComponent implements OnInit {
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
      pokemon: EditTierPokemon[];
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

  constructor(private battlezoneService: BattleZoneService) {
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

  drop(event: CdkDragDrop<{ name: string; pokemon: EditTierPokemon[] }>) {
    if (
      event.container === event.previousContainer &&
      event.previousIndex === event.currentIndex
    )
      return;
    const tier = event.previousContainer.data.pokemon[event.previousIndex];
    if (tier.orgTier) tier.orgTier.push(event);
    else tier.orgTier = [event];
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data.pokemon,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data.pokemon,
        event.container.data.pokemon,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  undoMove(pokemon: EditTierPokemon) {
    const event = pokemon.orgTier?.pop();
    if (!event) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data.pokemon,
        event.currentIndex,
        event.previousIndex,
      );
    } else {
      transferArrayItem(
        event.container.data.pokemon,
        event.previousContainer.data.pokemon,
        event.currentIndex,
        event.previousIndex,
      );
    }
  }

  dragStarted = false;

  onMouseDown() {
    this.dragStarted = false;
  }

  onMouseUp(pokemon: EditTierPokemon) {
    if (this.dragStarted) return;
    pokemon.selected = !pokemon.selected;
  }

  onDragStarted() {
    this.dragStarted = true;
  }
}
