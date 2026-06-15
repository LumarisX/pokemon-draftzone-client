import { Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { nameList } from '@pdz/shared/data/namedex';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

@Component({
  selector: 'pdz-debug-sprites',
  templateUrl: './debug-sprites.component.html',
  imports: [SpriteComponent, MatTooltipModule],
})
export class DebugSpritesComponent {
  names = nameList();
}
