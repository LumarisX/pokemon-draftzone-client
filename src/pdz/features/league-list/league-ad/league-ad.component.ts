import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { EXTERNAL_LINK_PATH } from '@pdz/core/route-paths';
import { LeagueAd } from '../league-ads.service';
import {
  BALLHEX,
  BallSVG,
} from '@pdz/shared/images/svg-components/ball.component';
import { CoinSVG } from '@pdz/shared/images/svg-components/pokecoin.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';

type TeamType = 'team-a' | 'team-b';
export type LeagueAdMode = 'public' | 'manage';

@Component({
  selector: 'pdz-league-ad',
  templateUrl: './league-ad.component.html',
  styleUrls: ['./league-ad.component.scss'],
  imports: [CommonModule, RouterModule, MarkdownModule, BallSVG, CoinSVG,
    CardComponent,
  ],
})
export class LeagueAdComponent implements OnInit {
  readonly league = input.required<LeagueAd>();
  readonly index = input<number>(0);
  readonly mode = input<LeagueAdMode>('public');

  @Output() delete = new EventEmitter<string>();

  weeks?: number;
  teamClass: TeamType = 'team-a';

  readonly SKILLBALLS: (keyof typeof BALLHEX)[] = [
    'poke',
    'great',
    'ultra',
    'master',
  ];
  readonly MILLISECONDS_IN_WEEK = 604800000;

  ngOnInit(): void {
    this.calculateSeasonWeeks();
    this.setTeamClass();
  }

  private calculateSeasonWeeks(): void {
    const league = this.league();
    if (!league.seasonEnd || !league.seasonStart) {
      return;
    }

    const startTime = new Date(league.seasonStart).getTime();
    const endTime = new Date(league.seasonEnd).getTime();
    const timeDiff = Math.abs(endTime - startTime);

    this.weeks = Math.round(timeDiff / this.MILLISECONDS_IN_WEEK);
  }

  private setTeamClass(): void {
    // this.teamClass = this.index % 2 === 0 ? 'team-a' : 'team-b';
  }

  getTeamClass(): TeamType {
    return this.teamClass;
  }

  hasTag(tag: string): boolean {
    return this.league().tags.includes(tag);
  }

  formatLink(link: string): string {
    return link.startsWith('http') ? link : `https://${link}`;
  }

  getExternalLinkUrl(link: string): string {
    const formattedLink = this.formatLink(link);
    return `/${EXTERNAL_LINK_PATH}?url=${encodeURIComponent(formattedLink)}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  onDelete(): void {
    this.delete.emit(this.league()._id);
  }
}
