import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../images/sprite.component';
import { FinderCoreComponent } from '../../tools/finder/finder-core.component';

@Component({
  selector: 'finder-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, SpriteComponent, FinderCoreComponent],
  templateUrl: './finder.component.html',
})
export class FinderPlannerComponent {
  constructor() {}
}
