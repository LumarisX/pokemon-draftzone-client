import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { LeagueTierListService } from '../../../services/leagues/league-tier-list.service';
import { TierListCoreComponent } from '../tier-list-core/tier-list-core.component';

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
    TierListCoreComponent,
  ],
  styleUrl: './tier-list.component.scss',
})
export class BZTierListComponent implements OnInit {
  tierListService = inject(LeagueTierListService);

  _menu: 'sort' | 'filter' | 'division' | null = null;

  set menu(value: 'sort' | 'filter' | 'division' | null) {
    if (value === 'filter') {
      this.tierListService.selectedTypes.set([
        ...this.tierListService.filteredTypes(),
      ]);
    }
    this._menu = value;
  }

  get menu() {
    return this._menu;
  }

  get divisionNames() {
    return Object.keys(this.tierListService.drafted());
  }

  constructor() {
    effect(() => {
      this.tierListService.selectedDivision(); // This establishes the dependency
      this.menu = null;
    });
  }

  ngOnInit(): void {
    this.tierListService.initialize('68c5a1c6f1ac9b585a542b8a');
  }

  updateFilter(selected: boolean, index?: number) {
    this.tierListService.updateFilter(selected, index);
  }

  applyFilter() {
    this.tierListService.applyFilter();
    this.menu = null;
  }
}