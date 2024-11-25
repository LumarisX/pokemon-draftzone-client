import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveChart } from '../../matchup-overview/matchup-interface';
import { MoveCategoryComponent } from '../../matchup-overview/matchup/movechart/move-category/move-category.component';
import { MinusSVG } from '../../images/svg-components/minus.component';

@Component({
  selector: 'moves',
  standalone: true,
  templateUrl: './moves.component.html',
  imports: [CommonModule, FormsModule, MoveCategoryComponent, MinusSVG],
})
export class MoveComponent {
  @Input() movechart!: MoveChart;
  showUnlearned: boolean = false;
  constructor() {}
}
