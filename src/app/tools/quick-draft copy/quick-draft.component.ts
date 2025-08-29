import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  QDPokemon,
  QuickDraftPicksComponent,
} from './quick-draft-picks/quick-draft-picks.component';
import {
  QDSettings,
  QuickDraftSettingComponent,
} from './quick-draft-setting/quick-draft-setting.component';
import { QuickDraftFinalComponent } from './quick-draft-final/quick-draft-final.component';

@Component({
  selector: 'pdz-quick-draft',
  imports: [
    CommonModule,
    QuickDraftSettingComponent,
    QuickDraftPicksComponent,
    QuickDraftFinalComponent,
  ],
  templateUrl: './quick-draft.component.html',
  styleUrl: './quick-draft.component.scss',
})
export class QuickDraftComponent implements OnInit {
  draftSettings?: QDSettings | null = null;
  finalDraft?: QDPokemon[] | null = null;

  ngOnInit(): void {}

  updateSettings(event: QDSettings | undefined) {
    this.draftSettings = event;
  }

  updateFinalDraft(event?: QDPokemon[]) {
    this.finalDraft = event;
  }

  getTotalPicks() {
    return this.draftSettings?.tiers.reduce((count, tier) => {
      return count + tier[1];
    }, 0);
  }

  restartDraft() {
    this.draftSettings = null;
    this.finalDraft = null;
  }
}
