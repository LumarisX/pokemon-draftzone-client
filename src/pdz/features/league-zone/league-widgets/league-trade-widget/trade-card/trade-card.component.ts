import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  ComparisonCardComponent,
  ComparisonEntity,
  StatusEntity,
} from '../../../comparison-card/comparison-card.component'; // Adjust path
import { TradeLog } from '../../../league.interface';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

// Define interfaces matching your tradeLog structure (simplified example)

@Component({
  selector: 'pdz-trade-card',
  imports: [
    ComparisonCardComponent,
    SpriteComponent,
    MatIconModule,
    CommonModule,
    IconComponent,
  ],
  templateUrl: './trade-card.component.html',
  styleUrls: ['./trade-card.component.scss'],
})
export class TradeCardComponent implements OnChanges {
  @Input({ required: true }) tradeLog!: TradeLog;
  /**
   * Index of the stage's current round. A trade only counts as active once
   * this reaches its `activeRound`; -1 means no round has been played yet.
   */
  @Input() currentRoundIndex = -1;

  private readonly DRAFT_POOL_NAME = 'Draft Pool';

  leftEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  rightEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  status: StatusEntity = { label: 'Pending' };

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

    this.status = this.resolveStatus();
  }

  /**
   * Mirrors the server's roster walk (getRosterByRound): a trade is only in
   * effect once it has been approved *and* its round has come around.
   */
  private resolveStatus(): StatusEntity {
    if (this.tradeLog.status === 'REJECTED') return { label: 'Rejected' };
    if (this.tradeLog.status === 'PENDING') return { label: 'Pending' };
    return this.tradeLog.activeRound <= this.currentRoundIndex
      ? { label: 'Active', active: true }
      : { label: 'Upcoming' };
  }
}
