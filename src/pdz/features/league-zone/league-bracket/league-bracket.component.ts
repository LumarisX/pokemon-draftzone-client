import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LeagueBracketCanvasComponent } from './league-bracket-canvas/league-bracket-canvas.component';
import {
  BracketWithSeeding,
  LeagueZoneService,
} from '../league-zone.service';

@Component({
  selector: 'pdz-league-bracket',
  imports: [CommonModule, LeagueBracketCanvasComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);

  bracketData?: BracketWithSeeding;

  ngOnInit(): void {
    this.leagueService.getBracket().subscribe((data) => {
      this.bracketData = data;
    });
  }
}
