import { CommonModule } from '@angular/common';
import { Component, OnChanges, input } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  ComparisonCardComponent,
  ComparisonEntity,
  StatusEntity,
} from '../../../comparison-card/comparison-card.component';
import { TradeLog } from '../../../league.interface';

@Component({
  selector: 'pdz-trade-card',
  imports: [
    ComparisonCardComponent,
    SpriteComponent,
    CommonModule,
    IconComponent,
  ],
  templateUrl: './trade-card.component.html',
  styleUrls: ['./trade-card.component.scss'],
})
export class TradeCardComponent implements OnChanges {
  readonly tradeLog = input.required<TradeLog>();

  readonly currentRoundIndex = input(-1);

  private readonly DRAFT_POOL_NAME = 'Draft Pool';

  leftEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  rightEntity: ComparisonEntity = {
    primaryName: this.DRAFT_POOL_NAME,
  };

  status: StatusEntity = { label: 'Pending' };

  ngOnChanges(): void {
    const from = this.tradeLog().side1;
    const to = this.tradeLog().side2;

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

  private resolveStatus(): StatusEntity {
    const tradeLog = this.tradeLog();
    if (tradeLog.status === 'REJECTED') return { label: 'Rejected' };
    if (tradeLog.status === 'PENDING') return { label: 'Pending' };
    return tradeLog.activeRound <= this.currentRoundIndex()
      ? { label: 'Active', active: true }
      : { label: 'Upcoming' };
  }
}
