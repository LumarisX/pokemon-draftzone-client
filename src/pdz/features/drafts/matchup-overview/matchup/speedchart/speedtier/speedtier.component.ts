import { Component, HostBinding, input } from '@angular/core';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Speedtier } from '../../../matchup-interface';

@Component({
  selector: 'pdz-speedtier',
  templateUrl: './speedtier.component.html',
  styleUrl: './speedtier.component.scss',
  imports: [SpriteComponent],
})
export class SpeedtierComponent {
  readonly tier = input.required<Speedtier>();
  @HostBinding('class.alternate')
  readonly alternate = input(false);
}
