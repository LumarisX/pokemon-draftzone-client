import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import {
  ComparisonCardComponent,
  ComparisonEntity,
} from '../../comparison-card/comparison-card.component'; // Adjust path
import { TradeLog } from '../../league.interface';
import { getLogoUrl } from '../../league.util';

// Define interfaces matching your tradeLog structure (simplified example)

@Component({
  selector: 'pdz-trade-card',
  standalone: true,
  imports: [
    ComparisonCardComponent,
    SpriteComponent,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './trade-card.component.html',
  styleUrls: ['./trade-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeCardComponent {
  @Input({ required: true }) tradeLog!: TradeLog;

  private readonly DRAFT_POOL_NAME = 'Draft Pool';

  leftEntity = computed<ComparisonEntity>(() => {
    const from = this.tradeLog.side1;
    return {
      logoUrl: from.team?.logo,
      primaryName: from.team?.name || this.DRAFT_POOL_NAME,
      secondaryName: from.team?.coach,
    };
  });

  rightEntity = computed<ComparisonEntity>(() => {
    const to = this.tradeLog.side2;
    return {
      logoUrl: to.team?.logo,
      primaryName: to.team?.name || this.DRAFT_POOL_NAME,
      secondaryName: to.team?.coach,
    };
  });
}
