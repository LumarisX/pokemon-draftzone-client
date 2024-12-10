import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MoveChart } from '../../matchup-interface';
import { MoveCategoryComponent } from './move-category/move-category.component';
import { MinusSVG } from '../../../images/svg-components/minus.component';
import { PlusSVG } from '../../../images/svg-components/plus.component';

@Component({
  selector: 'movechart',
  standalone: true,
  templateUrl: './movechart.component.html',
  imports: [CommonModule, MoveCategoryComponent, MinusSVG, PlusSVG],
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];

  selectedTeam: number = 1;
  get toggleAll(): boolean {
    return this.teams[this.selectedTeam].some((category) => {
      console.log(category.categoryName, category.show);
      return category.show ?? true;
    });
  }

  constructor() {}

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-aTeam-300';
    return 'bg-bTeam-300';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-aTeam-300 hover:bg-aTeam-300';
    return 'bg-bTeam-300 hover:bg-bTeam-300';
  }

  toggleCollapse() {
    let collapse = !this.toggleAll;
    this.teams[this.selectedTeam].forEach((category) => {
      category.show = collapse;
    });
  }
}
