import { Component, Input } from '@angular/core';
import { IconComponent } from '../../images/icon/icon.component';

@Component({
  selector: 'pdz-pokemon-type',
  imports: [IconComponent],
  templateUrl: './pokemon-type.component.html',
  styleUrl: './pokemon-type.component.scss',
})
export class PokemonTypeComponent {
  @Input({ required: true }) type!: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() display: 'icon' | 'text' | 'both' = 'text';
  @Input() direction: 'row' | 'column' = 'row';
  @Input() disabled = false;

  get color(): string {
    return PokemonTypeComponent.typeColor(this.type) ?? 'var(--pdz-color-text)';
  }

  get typeIconName(): string | null {
    const key = `type-${this.type.toLowerCase()}`;
    // Stellar and unknown types don't have gen9 icons
    if (
      ![
        'bug',
        'dark',
        'dragon',
        'electric',
        'fairy',
        'fighting',
        'fire',
        'flying',
        'ghost',
        'grass',
        'ground',
        'ice',
        'normal',
        'poison',
        'psychic',
        'rock',
        'steel',
        'water',
      ].includes(this.type.toLowerCase())
    ) {
      return null;
    }
    return key;
  }

  get iconSize(): number {
    if (this.direction === 'column') return 22;
    switch (this.size) {
      case 'small':
        return 10;
      case 'large':
        return 22;
      default:
        return 12;
    }
  }

  static typeColor(type?: string | null) {
    if (!type) return undefined;
    switch (type) {
      case 'Bug':
        return '#91A119';
      case 'Dark':
        return '#50413F';
      case 'Dragon':
        return '#5060E1';
      case 'Electric':
        return '#FAC000';
      case 'Fairy':
        return '#EF70EF';
      case 'Fighting':
        return '#FF8000';
      case 'Fire':
        return '#E62829';
      case 'Flying':
        return '#81B9EF';
      case 'Ghost':
        return '#704170';
      case 'Grass':
        return '#3FA129';
      case 'Ground':
        return '#915121';
      case 'Ice':
        return '#3FD8FF';
      case 'Normal':
        return '#9FA19F';
      case 'Poison':
        return '#9141CB';
      case 'Psychic':
        return '#EF4179';
      case 'Rock':
        return '#AFA981';
      case 'Steel':
        return '#60A1B8';
      case 'Stellar':
        return 'linear-gradient(120deg in hsl longer hue, hsl(0 75% 45%) 0%, hsl(360 75% 45%) 100%)';
      case 'Water':
        return '#2980EF';
    }
    return null;
  }
}
