
import { Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'debug-sprites',
  standalone: true,
  templateUrl: './debug-sprites.component.html',
  imports: [SpriteComponent, MatTooltipModule],
})
export class DebugSpritesComponent {
  names = nameList();
}
