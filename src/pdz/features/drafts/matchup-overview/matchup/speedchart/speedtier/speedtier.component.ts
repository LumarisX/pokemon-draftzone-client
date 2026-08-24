import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Speedtier } from '../../../matchup-interface';

@Component({
  selector: 'pdz-speedtier',
  templateUrl: './speedtier.component.html',
  styleUrl: './speedtier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipComponent, SpriteComponent],
  host: { class: 'speedtier' },
})
export class SpeedtierComponent {
  readonly tier = input.required<Speedtier>();

  protected readonly tone = computed<ChipTone>(() =>
    this.tier().team === 1 ? 'secondary' : 'primary',
  );
}
