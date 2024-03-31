import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../sprite/sprite.component';
import { MoveChart } from '../../matchup-overview/matchup-interface';
import { MoveCategoryComponent } from '../../matchup-overview/matchup/movechart/move-category/move-category.component';

@Component({
  selector: 'moves',
  standalone: true,
  templateUrl: './moves.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent, MoveCategoryComponent],
})
export class MoveComponent {
  @Input() movechart!: MoveChart;
  constructor() {}
}
