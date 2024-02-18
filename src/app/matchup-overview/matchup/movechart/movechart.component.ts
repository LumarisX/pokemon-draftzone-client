import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { MoveChart } from '../../matchup-interface';
import { MoveCategoryComponent } from './move-category/move-category.component';

@Component({
  selector: 'movechart',
  standalone: true,
  templateUrl: './movechart.component.html',
  imports: [
    CommonModule,
    SpriteComponent,
    MovechartComponent,
    MoveCategoryComponent,
  ],
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];
  selectedTeam: number = 1;

  constructor() {}

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-cyan-400';
    return 'bg-red-400';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-cyan-400 hover:bg-cyan-300';
    return 'bg-red-400 hover:bg-red-300';
  }
}
