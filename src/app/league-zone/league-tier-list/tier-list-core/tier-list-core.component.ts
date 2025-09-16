import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { LoadingComponent } from '../../../images/loading/loading.component';
import {
  TierPokemon,
  LeagueTierGroup,
} from '../../../interfaces/tier-pokemon.interface';
import { typeColor } from '../../../util/styling';

@Component({
  selector: 'pdz-tier-list-core',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    SpriteComponent,
    LoadingComponent,
  ],
  templateUrl: './tier-list-core.component.html',
  styleUrls: ['./tier-list-core.component.scss'],
})
export class TierListCoreComponent implements OnChanges {
  private elRef = inject(ElementRef);

  @Input() tierGroups: LeagueTierGroup[] | null = [];
  @Input() draftedPokemonIds: Set<string> = new Set(); // New input
  @Input() typeInFilter: (pokemon: TierPokemon) => boolean = () => true;
  @Input() makeBanString: (banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  }) => string = () => '';

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

  emitDraftPokemon() {
    if (this.selectedPokemon) this.draftPokemon.emit(this.selectedPokemon);
    this.selectedPokemon = null;
  }

  isPokemonDrafted(pokemonId: string): boolean {
    // console.log('TierListCoreComponent: Checking if drafted:', pokemonId, this.draftedPokemonIds.has(pokemonId)); // Removed debug log
    return this.draftedPokemonIds.has(pokemonId);
  }
}