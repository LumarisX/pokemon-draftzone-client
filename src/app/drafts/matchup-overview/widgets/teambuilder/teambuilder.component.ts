import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { MatchupData } from '../../matchup-interface';

@Component({
  selector: 'pdz-teambuilder-widget',
  templateUrl: './teambuilder.component.html',
  styleUrls: ['./teambuilder.component.scss', '../../matchup.scss'],
  imports: [CommonModule, RouterModule, SpriteComponent],
})
export class TeambuilderWidgetComponent {
  @Input({ required: true })
  matchupId!: string;
  @Input({ required: true })
  matchupData!: MatchupData;

  team: Pokemon[] = [];

  view: keyof typeof this.team | null = 0;

  ngOnInit() {
    this.loadTeam();
  }

  loadTeam() {
    this.team = [{ name: 'Deoxys-Attack', id: 'deoxysattack' }];
  }
}
