import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite.component';
import { MoveCategory } from '../../../matchup-interface';

@Component({
  selector: 'move-category',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './move-category.component.html',
})
export class MoveCategoryComponent {
  @Input() category!: MoveCategory;
  show: boolean = true;
  constructor() {}

  typeBorder(type: string) {
    return ['border-' + type.toLowerCase()];
  }
}
