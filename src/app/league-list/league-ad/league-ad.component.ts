import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';
import { LeagueAd } from '../../services/league-ads.service';
import { ExternalLinkPath } from '../../pages/page-routing.module';

type TeamType = 'team-a' | 'team-b';
export type LeagueAdMode = 'public' | 'manage';

@Component({
  selector: 'pdz-league-ad',
  templateUrl: './league-ad.component.html',
  styleUrls: ['./league-ad.component.scss'],
  imports: [CommonModule, MarkdownModule, BallSVG, CoinSVG],
})
export class LeagueAdComponent implements OnInit {
  @Input() league!: LeagueAd;
  @Input() index: number = 0;
  @Input() mode: LeagueAdMode = 'public';

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
    if (!this.league.seasonEnd || !this.league.seasonStart) {
      return;
    }

    const startTime = new Date(this.league.seasonStart).getTime();
    const endTime = new Date(this.league.seasonEnd).getTime();
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
    return this.league.tags.includes(tag);
  }

  formatLink(link: string): string {
    return link.startsWith('http') ? link : `https://${link}`;
  }

  getExternalLinkUrl(link: string): string {
    const formattedLink = this.formatLink(link);
    return `/${ExternalLinkPath}?url=${encodeURIComponent(formattedLink)}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  onDelete(): void {
    this.delete.emit(this.league._id);
  }
}
