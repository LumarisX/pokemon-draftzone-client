import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { DraftPokemon } from '../../drafts/draft.model';
import { DataService } from '@pdz/core/services/data.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

@Component({
  selector: 'pdz-random-draft',
  templateUrl: './random-draft.component.html',
  imports: [SpriteComponent, RouterModule, FormsModule],
})
export class RandomDraftComponent {
  private dataService = inject(DataService);

  draftPath = DRAFT_OVERVIEW_PATH;
  ruleset = 'Gen9 NatDex';
  format = 'Singles';
  _count: number = 12;
  set count(value: number) {
    this._count = value > 0 ? (value < 20 ? value : 20) : 1;
  }
  get count() {
    return this._count;
  }

  team: DraftPokemon[] = [];

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
