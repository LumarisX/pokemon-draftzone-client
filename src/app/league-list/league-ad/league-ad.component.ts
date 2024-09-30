import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LeagueAd } from '../../api/league-ads.service';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';

@Component({
  selector: 'league-ad',
  templateUrl: './league-ad.component.html',
  standalone: true,
  imports: [CommonModule, BallSVG, CoinSVG],
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
      wifi: this.league.divisions.some(
        (division) => division.platform !== 'Pokémon Showdown'
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
