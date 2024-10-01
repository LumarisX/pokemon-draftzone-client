import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LeagueAd } from '../../api/league-ads.service';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';
import { WifiSVG } from '../../images/svg-components/wifi.component';
import { CompactDownSVG } from '../../images/svg-components/compact-down.component';
import { CompactUpSVG } from '../../images/svg-components/compact-up.component';
import { MouseSVG } from '../../images/svg-components/mouse.component';

@Component({
  selector: 'league-ad',
  templateUrl: './league-ad.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BallSVG,
    CoinSVG,
    WifiSVG,
    CompactDownSVG,
    CompactUpSVG,
    MouseSVG,
  ],
})
export class LeagueAdComponent implements OnInit {
  @Input()
  league!: LeagueAd;
  collapsed: boolean = true;
  weeks?: number;
  tags!: {
    skill: number;
    prize: boolean;
    doubles: boolean;
    singles: boolean;
    wifi: boolean;
    ps: boolean;
  };

  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  constructor() {}
  ngOnInit(): void {
    this.tags = {
      skill: this.league.divisions.reduce(
        (prev, division) =>
          division.skillLevelRange.from < prev
            ? division.skillLevelRange.from
            : prev,
        3
      ),
      prize: this.league.divisions.some(
        (division) => division.prizeValue && division.prizeValue > 0
      ),
      doubles: this.league.divisions.some((division) =>
        ['VGC', 'Doubles'].includes(division.format)
      ),
      singles: this.league.divisions.some((division) =>
        ['Singles', 'LC'].includes(division.format)
      ),
      wifi: this.league.divisions.some((division) =>
        ['Scarlet/Violet'].includes(division.platform)
      ),
      ps: this.league.divisions.some((division) =>
        ['Pokémon Showdown', 'Pokemon Showdown'].includes(division.platform)
      ),
    };

    if (this.league.seasonEnd && this.league.seasonStart)
      this.weeks = Math.round(
        Math.abs(
          new Date(this.league.seasonEnd).getTime() -
            new Date(this.league.seasonStart).getTime()
        ) / 604800000
      );
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
