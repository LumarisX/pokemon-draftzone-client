import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { NumberSuffixPipe } from '../../util/pipes/number-suffix.pipe';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';
import { LeagueDraftingService } from '../../services/league-drafting.service';

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
    NumberSuffixPipe,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftingComponent implements OnInit {
  draftOrder!: {
    teamName: string;
    status?: string;
    pokemon?: Pokemon;
  }[][];

  myTeamName = 'Deimos Deoxys';

  myDraft!: {
    drafted: { pokemon: Pokemon; cost: string }[];
    picks: { pokemon: Pokemon; cost: string }[][];
  };

  draftingService = inject(LeagueDraftingService);

  ngOnInit(): void {
    this.draftingService.getDraft().subscribe((data) => (this.myDraft = data));
    this.draftingService
      .getDraftOrder()
      .subscribe((data) => (this.draftOrder = data));
  }

  moveUp(picks: { pokemon: Pokemon; cost: string }[], index: number) {
    if (!index || index >= picks.length) return;
    const temp = picks[index];
    picks[index] = picks[index - 1];
    picks[index - 1] = temp;
  }
}
