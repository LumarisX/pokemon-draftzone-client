import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LeagueBracketGraphComponent } from './league-single-elim-bracket/league-bracket-graph.component';

@Component({
  selector: 'pdz-league-bracket',
  imports: [CommonModule, LeagueBracketGraphComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent {}
