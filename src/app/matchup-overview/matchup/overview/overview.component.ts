import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../images/sprite.component';
import { TeraComponent } from '../../../images/tera.component';
import { Summary } from '../../matchup-interface';

@Component({
  selector: 'overview',
  standalone: true,
  templateUrl: './overview.component.html',
  imports: [CommonModule, SpriteComponent, TeraComponent],
})
export class OverviewComponent {
  @Input() teams: Summary[] = [];

  constructor() {}
}
