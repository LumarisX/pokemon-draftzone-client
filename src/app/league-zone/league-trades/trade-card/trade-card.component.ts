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
  private readonly DEFAULT_LOGO =
    'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1745265573766-pdbl.png';

  leftEntity = computed<ComparisonEntity>(() => {
    const from = this.tradeLog.from;
    return {
      logoUrl: from.team?.logo || this.DEFAULT_LOGO,
      primaryName: from.team?.teamName || this.DRAFT_POOL_NAME,
      secondaryName: from.team?.coaches[0],
      defaultLogo: this.DEFAULT_LOGO,
    };
  });

  rightEntity = computed<ComparisonEntity>(() => {
    const to = this.tradeLog.to;
    return {
      logoUrl: to.team?.logo || this.DEFAULT_LOGO,
      primaryName: to.team?.teamName || this.DRAFT_POOL_NAME,
      secondaryName: to.team?.coaches[0],
      defaultLogo: this.DEFAULT_LOGO,
    };
  });
}
