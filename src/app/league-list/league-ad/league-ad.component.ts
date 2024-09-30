import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LeagueAd } from '../../api/league-ads.service';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';

@Component({
  selector: 'league-ad',
  templateUrl: './league-ad.component.html',
  standalone: true,
  imports: [CommonModule, BallSVG],
})
export class LeagueAdComponent {
  @Input()
  league!: LeagueAd;

  collapsed: boolean = true;

  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  constructor() {}

  getMinSkill(league: LeagueAd): number {
    return league.divisions.reduce(
      (prev, division) =>
        division.skillLevelRange.to < prev
          ? division.skillLevelRange.from
          : prev,
      3
    );
  }

  getWeeks(league: LeagueAd) {
    return Math.round(
      Math.abs(
        new Date(league.seasonEnd).getTime() -
          new Date(league.seasonStart).getTime()
      ) / 604800000
    );
  }
}
