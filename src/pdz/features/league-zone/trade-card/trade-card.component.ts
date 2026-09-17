import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  BadgeComponent,
  BadgeTone,
} from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TradeLog, TradeParticipant, TradePokemon } from '../league.interface';
import { getLogoUrl } from '../league.util';

@Component({
  selector: 'pdz-trade-card',
  imports: [
    DatePipe,
    BadgeComponent,
    CardComponent,
    IconComponent,
    SpriteComponent,
  ],
  templateUrl: './trade-card.component.html',
  styleUrl: './trade-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeCardComponent {
  readonly trade = input.required<TradeLog>();
  readonly currentRoundIndex = input(-1);
  readonly showTime = input(true);

  protected readonly sides = computed<TradeParticipant[]>(() => [
    this.trade().side1,
    this.trade().side2,
  ]);

  protected readonly status = computed<{ label: string; tone: BadgeTone }>(
    () => {
      const trade = this.trade();
      if (trade.status === 'REJECTED')
        return { label: 'Rejected', tone: 'danger' };
      if (trade.status === 'PENDING')
        return { label: 'Pending', tone: 'warning' };
      return trade.activeRound <= this.currentRoundIndex()
        ? { label: 'Approved', tone: 'success' }
        : { label: 'Upcoming', tone: 'info' };
    },
  );

  protected readonly tradePoints = computed(() => {
    const trade = this.trade();
    return (trade.side1.tradePoints ?? 0) + (trade.side2.tradePoints ?? 0);
  });

  protected readonly tradePointsBreakdown = computed(() =>
    this.sides()
      .filter((side) => side.team && side.tradePoints)
      .map((side) => `${side.team?.name}: ${side.tradePoints} TP`)
      .join(' · '),
  );

  protected logo(side: TradeParticipant): string {
    return getLogoUrl(side.team?.logo);
  }

  protected pickValue(pokemon: TradePokemon): string | undefined {
    return pokemon.tier ?? pokemon.cost?.toString();
  }
}
