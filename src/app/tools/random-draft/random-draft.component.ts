import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'random-draft',
  standalone: true,
  templateUrl: './random-draft.component.html',
  imports: [CommonModule, SpriteComponent, RouterModule, FormsModule],
})
export class RandomDraftComponent {
  private dataService = inject(DataService);

  draftPath = DraftOverviewPath;
  ruleset = 'Gen9 NatDex';
  format = 'Singles';
  _count: number = 12;
  set count(value: number) {
    this._count = value > 0 ? (value < 20 ? value : 20) : 1;
  }
  get count() {
    return this._count;
  }

  team: Pokemon[] = [];

  getRandom() {
    this.dataService
      .getRandom(this.count, this.ruleset, this.format)
      .subscribe((data) => {
        this.team = data;
      });
  }

  teamIds() {
    return this.team.map((pokemon) => pokemon.id);
  }
}
