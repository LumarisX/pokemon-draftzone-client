import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LeagueAd } from '../../services/league-ads.service';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { CompactSVG } from '../../images/svg-components/compact.component';
import { MouseSVG } from '../../images/svg-components/mouse.component';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';
import { GamepadSVG } from '../../images/svg-components/gamepad.component';

@Component({
  selector: 'league-ad',
  templateUrl: './league-ad.component.html',
  standalone: true,
  imports: [CommonModule, BallSVG, CoinSVG, GamepadSVG, CompactSVG, MouseSVG],
})
export class LeagueAdComponent implements OnInit {
  @Input()
  league!: LeagueAd;
  collapsed: boolean = true;
  weeks?: number;
  @Input()
  index: number = 0;

  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  constructor() {}
  ngOnInit(): void {
    if (this.league.seasonEnd && this.league.seasonStart)
      this.weeks = Math.round(
        Math.abs(
          new Date(this.league.seasonEnd).getTime() -
            new Date(this.league.seasonStart).getTime(),
        ) / 604800000,
      );
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  getTeamColor(bg: string, shadow: string) {
    return this.index % 2
      ? `bg-bTeam-${bg} shadow-bTeam-${shadow}`
      : `bg-aTeam-${bg} shadow-aTeam-${shadow}`;
  }
}
