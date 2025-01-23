import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'debug-sprites',
  standalone: true,
  templateUrl: './debug-sprites.component.html',
  imports: [CommonModule, SpriteComponent],
})
export class DebugSpritesComponent {
  names = nameList();
  constructor() {}
}
