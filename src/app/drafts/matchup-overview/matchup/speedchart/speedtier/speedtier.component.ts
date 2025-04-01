import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../../../images/sprite/sprite.component';
import { Speedtier } from '../../../matchup-interface';

@Component({
  selector: 'speedtier',
  templateUrl: './speedtier.component.html',
  styleUrl: './speedtier.component.scss',
  imports: [CommonModule, SpriteComponent],
})
export class SpeedtierComponent {
  @Input() tier!: Speedtier;

  modifierPath(modifier: string): string {
    switch (modifier) {
      case '252':
        return '../../../../assets/icons/speedchart/252.svg';
      case '0':
        return '../../../../assets/icons/speedchart/0.svg';
      case 'Positive':
        return '../../../../assets/icons/speedchart/plus.svg';
      case 'Negative':
        return '../../../../assets/icons/speedchart/minus.svg';
      case 'Stage 1':
        return '../../../../assets/icons/speedchart/plus1.svg';
      case 'Stage 2':
        return '../../../../assets/icons/speedchart/plus2.svg';
      case 'Stage 3':
        return '../../../../assets/icons/speedchart/plus3.svg';
      case 'Stage 4':
        return '../../../../assets/icons/speedchart/plus4.svg';
      case 'Stage 5':
        return '../../../../assets/icons/speedchart/plus5.svg';
      case 'Stage 6':
        return '../../../../assets/icons/speedchart/plus6.svg';
      case 'Stage -1':
        return '../../../../assets/icons/speedchart/minus1.svg';
      case 'Choice Scarf':
        return '../../../../assets/icons/speedchart/scarf.svg';
      case 'Tailwind':
        return '../../../../assets/icons/speedchart/tailwind.svg';
      case 'Paralysis':
        return '../../../../assets/icons/speedchart/paralyzed.svg';
      case 'Quark Drive':
        return '../../../../assets/icons/speedchart/booster.svg';
      case 'Protosynthesis':
        return '../../../../assets/icons/speedchart/booster.svg';
      case 'Sand Rush':
        return '../../../../assets/icons/speedchart/sand.svg';
      case 'Swift Swim':
        return '../../../../assets/icons/speedchart/rain.svg';
      case 'Chlorophyll':
        return '../../../../assets/icons/speedchart/sun.svg';
      case 'Slush Rush':
        return '../../../../assets/icons/speedchart/snow.svg';
      case 'Iron Ball':
        return '../../../../assets/icons/speedchart/ironball.svg';
      case 'Quick Feet':
        return '../../../../assets/icons/speedchart/flameorb.svg';
      case 'Unburden':
        return '../../../../assets/icons/speedchart/unburden.svg';
      case 'Surge Surfer':
        return '../../../../assets/icons/speedchart/surf.svg';
    }
    return '';
  }
}
