import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite.component';
import { MoveCategory } from '../../../matchup-interface';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { PlusSVG } from '../../../../images/svg-components/plus.component';
import { MinusSVG } from '../../../../images/svg-components/minus.component';

@Component({
  selector: 'move-category',
  standalone: true,
  imports: [CommonModule, PlusSVG, MinusSVG, SpriteComponent],
  templateUrl: './move-category.component.html',
  animations: [
    trigger('growIn', [
      state('void', style({ height: '0', overflow: 'hidden' })),
      state('*', style({ height: '*' })),
      transition('void <=> *', [animate('0.5s ease-in-out')]),
    ]),
  ],
})
export class MoveCategoryComponent {
  @Input() category!: MoveCategory;
  show: boolean = true;
  constructor() {}

  typeBorder(type: string) {
    return ['border-' + type.toLowerCase()];
  }
}
