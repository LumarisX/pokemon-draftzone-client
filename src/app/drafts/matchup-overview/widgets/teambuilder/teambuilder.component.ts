import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StatsTable } from '../../../../data';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import { PokemonSet } from '../../../../tools/teambuilder/pokemon-builder.model';
import { MatchupData } from '../../matchup-interface';

@Component({
  selector: 'pdz-teambuilder-widget',
  templateUrl: './teambuilder.component.html',
  styleUrls: ['./teambuilder.component.scss', '../../matchup.scss'],
  imports: [CommonModule, RouterModule, FormsModule, SpriteComponent],
})
export class TeambuilderWidgetComponent {
  @Input({ required: true }) matchupId!: string;
  @Input({ required: true }) matchupData!: MatchupData;

  teambuilderService = inject(TeambuilderService);

  team: PokemonSet[] = [];
  view: number | null = 0;

  statNames: (keyof StatsTable)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

  ngOnInit() {
    this.loadTeam();
  }

  loadTeam() {
    this.teambuilderService
      .getPokemonData(
        this.matchupData.summary[0].team[0].id,
        this.matchupData.details.ruleset,
      )
      .subscribe((pokemonData) => {
        this.team = [
          PokemonSet.fromTeambuilder(pokemonData, {
            shiny: this.matchupData.summary[0].team[0].shiny,
            nickname: this.matchupData.summary[0].team[0].nickname,
            level: this.matchupData.details.level,
          }),
        ];
      });
  }

  getStep() {
    return 4;
  }

  hpRating(hp: number): string {
    let stars = '';
    if (hp % this.matchupData.details.level === 1) {
      stars += '*';
    }

    if (hp % 16 === 1) {
      stars += '*';
    }
    if (hp % 4 === 1) {
      stars += '*';
    }
    if (hp % 2 === 1) {
      stars += '*';
    }

    return stars;
  }

  setNature(stat: keyof StatsTable, natureType: 'positive' | 'negative') {
    this.team[0].nature = {
      name: 'test',
      drop:
        natureType === 'negative' ? stat : (this.team[0].nature?.drop ?? 'hp'),
      boost:
        natureType === 'positive' ? stat : (this.team[0].nature?.boost ?? 'hp'),
    };
  }
}
