import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
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
})
export class TradeCardComponent implements OnChanges {
  @Input({ required: true }) tradeLog!: TradeLog;

  private readonly DRAFT_POOL_NAME = 'Draft Pool';

  leftEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  rightEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  ngOnChanges(): void {
    const from = this.tradeLog.side1;
    const to = this.tradeLog.side2;

    this.leftEntity = {
      logoUrl: from.team?.logo,
      primaryName: from.team?.name || this.DRAFT_POOL_NAME,
      secondaryName: from.team?.coach,
    };

    this.rightEntity = {
      logoUrl: to.team?.logo,
      primaryName: to.team?.name || this.DRAFT_POOL_NAME,
      secondaryName: to.team?.coach,
    };
  }
}
