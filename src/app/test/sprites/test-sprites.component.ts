import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'test-sprites',
  standalone: true,
  templateUrl: './test-sprites.component.html',
  imports: [CommonModule, SpriteComponent, RouterModule],
})
export class TestSpritesComponent {
  names = nameList();
  constructor() {}
}
