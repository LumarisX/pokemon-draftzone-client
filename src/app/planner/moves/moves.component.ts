import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveChart } from '../../drafts/matchup-overview/matchup-interface';
import { MoveCategoryComponent } from '../../drafts/matchup-overview/matchup/movechart/move-category/move-category.component';

@Component({
  selector: 'moves',
  standalone: true,
  templateUrl: './moves.component.html',
  imports: [CommonModule, FormsModule, MoveCategoryComponent],
})
export class MoveComponent {
  @Input() movechart!: MoveChart;
  showUnlearned: boolean = false;
  constructor() {}
}
