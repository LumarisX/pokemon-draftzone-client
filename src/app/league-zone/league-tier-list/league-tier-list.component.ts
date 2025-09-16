import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ElementRef,
  effect,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import { LeagueTierListService } from '../../services/leagues/league-tier-list.service';
import { typeColor } from '../../util/styling';

@Component({
  selector: 'pdz-league-tier-list',
  standalone: true,
  templateUrl: './league-tier-list.component.html',
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
    LoadingComponent,
    SpriteComponent,
  ],
  styleUrl: './league-tier-list.component.scss',
})
export class LeagueTierListComponent implements OnInit {
  private elRef = inject(ElementRef);

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
    this.tierListService.initialize('pdbls2');
  }

  updateFilter(selected: boolean, index?: number) {
    this.tierListService.updateFilter(selected, index);
  }

  applyFilter() {
    this.tierListService.applyFilter();
    this.menu = null;
  }

  get tierGroups() {
    return this.tierListService.sortedTierGroups();
  }

  get draftedPokemonIds() {
    return this.tierListService.draftedPokemonIdsForSelectedDivision();
  }

  get typeInFilter() {
    return this.tierListService.typeInFilter.bind(this.tierListService);
  }

  get makeBanString() {
    return this.tierListService.makeBanString.bind(this.tierListService);
  }

  @Output() draftPokemon = new EventEmitter<TierPokemon & { tier: string }>();

  selectedPokemon: (TierPokemon & { tier: string }) | null = null;
  cardPosition = { top: '0px', left: '0px' };
  typeColor = typeColor;

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['draftedPokemonIds']) { // Removed debug log
    //   console.log('TierListCoreComponent: draftedPokemonIds input changed:', changes['draftedPokemonIds'].currentValue);
    // }
  }

  selectPokemon(pokemon: TierPokemon, tier: string, event: MouseEvent) {
    if (this.selectedPokemon?.id === pokemon.id) {
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

  emitDraftPokemon() {
    if (this.selectedPokemon) this.draftPokemon.emit(this.selectedPokemon);
    this.selectedPokemon = null;
  }

  isPokemonDrafted(pokemonId: string): boolean {
    // console.log('TierListCoreComponent: Checking if drafted:', pokemonId, this.draftedPokemonIds.has(pokemonId)); // Removed debug log
    return this.draftedPokemonIds.has(pokemonId);
  }
}
