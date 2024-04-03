import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatchupService } from '../../../api/matchup.service';
import { SpriteComponent } from '../../../images/sprite.component';
import { Summary } from '../../matchup-interface';

@Component({
  selector: 'overview',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  @Input() teams: Summary[] = [];

  constructor(private matchupService: MatchupService) {}
}
