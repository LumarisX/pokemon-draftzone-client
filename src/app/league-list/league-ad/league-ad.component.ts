import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LeagueAd } from '../../api/league-ads.service';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { CompactDownSVG } from '../../images/svg-components/compact-down.component';
import { CompactUpSVG } from '../../images/svg-components/compact-up.component';
import { GamepadSVG } from '../../images/svg-components/gamepad.component';
import { MouseSVG } from '../../images/svg-components/mouse.component';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';

@Component({
  selector: 'league-ad',
  templateUrl: './league-ad.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BallSVG,
    CoinSVG,
    GamepadSVG,
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
  team: string = '';
  @Input()
  index: number = 0;

  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  constructor() {}
  ngOnInit(): void {
    if (this.league.seasonEnd && this.league.seasonStart)
      this.weeks = Math.round(
        Math.abs(
          new Date(this.league.seasonEnd).getTime() -
            new Date(this.league.seasonStart).getTime()
        ) / 604800000
      );
    this.team = this.index % 2 ? 'bTeam' : 'aTeam';
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
