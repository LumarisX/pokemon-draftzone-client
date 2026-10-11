import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { StoredSide, orderForViewer } from '@pdz/core/utils/versus';
import {
  TradeLog,
  TradeParticipant,
  TradePokemon,
} from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import {
  BadgeComponent,
  BadgeTone,
} from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';

@Component({
  selector: 'pdz-trade-card',
  imports: [
    DatePipe,
    BadgeComponent,
    CardComponent,
    IconComponent,
    PokemonComponent,
    TeamComponent,
  ],
  templateUrl: './trade-card.component.html',
  styleUrl: './trade-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeCardComponent {
  readonly trade = input.required<TradeLog>();
  readonly currentRoundIndex = input(-1);
  readonly showTime = input(true);
  readonly viewerTeamId = input<string | null | undefined>(null);

  private readonly viewerSide = computed<StoredSide | null>(() => {
    const teamId = this.viewerTeamId();
    if (!teamId) return null;
    const trade = this.trade();
    if (trade.side1.team?.id === teamId) return 'side1';
    if (trade.side2.team?.id === teamId) return 'side2';
    return null;
  });

  protected readonly versus = computed(() =>
    orderForViewer(this.trade().side1, this.trade().side2, this.viewerSide()),
  );

  protected readonly sides = computed(() => [
    this.versus().team1,
    this.versus().team2,
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
      .map((side) => side.value)
      .filter((side) => side.team && side.tradePoints)
      .map((side) => `${side.team?.name}: ${side.tradePoints} TP`)
      .join(' · '),
  );

  protected logo(side: TradeParticipant): string | undefined {
    return getTeamLogoSrc(side.team?.logo);
  }

  protected pickValue(pokemon: TradePokemon): string | undefined {
    return pokemon.tier ?? pokemon.cost?.toString();
  }
}
