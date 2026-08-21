import { Component } from '@angular/core';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { nameList } from '@pdz/shared/data/namedex';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-debug-sprites',
  templateUrl: './debug-sprites.component.html',
  styleUrl: './debug-sprites.component.scss',
  imports: [SpriteComponent, TooltipDirective, PageComponent],
})
export class DebugSpritesComponent {
  names = nameList();
}
