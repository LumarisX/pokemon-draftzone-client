import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import { LeagueTierListService } from '../../services/leagues/league-tier-list.service';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { TierListCoreComponent } from './tier-list-core/tier-list-core.component';

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
    TierListCoreComponent,
  ],
  templateUrl: './league-tier-list.component.html',
  styleUrl: './league-tier-list.component.scss',
  providers: [LeagueTierListService],
})
export class LeagueTierListComponent implements OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  public tierListService = inject(LeagueTierListService);

  private readonly destroy$ = new Subject<void>();

  @Output()
  draftPokemon = new EventEmitter<TierPokemon & { tier: string }>();

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

  constructor() {
    effect(() => {
      this.tierListService.sortBy();
      this.menu = null;
    });

    effect(() => {
      const leagueId = this.leagueZoneService.leagueId();
      if (leagueId) {
        this.tierListService.initialize(leagueId);
      }
    });

    effect(() => {
      this.tierListService.selectedDivision(); // This establishes the dependency
      this.menu = null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter() {
    this.tierListService.applyFilter();
    this.menu = null;
  }
}
