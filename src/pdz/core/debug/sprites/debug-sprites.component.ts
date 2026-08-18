import { Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { nameList } from '@pdz/shared/data/namedex';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-debug-sprites',
  templateUrl: './debug-sprites.component.html',
  styleUrl: './debug-sprites.component.scss',
  imports: [SpriteComponent, MatTooltipModule, PageComponent],
})
export class DebugSpritesComponent {
  names = nameList();
}
