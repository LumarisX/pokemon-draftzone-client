import { Component } from '@angular/core';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { QuickDraftFinalComponent } from './quick-draft-final/quick-draft-final.component';
import {
  QDPokemon,
  QuickDraftPicksComponent,
} from './quick-draft-picks/quick-draft-picks.component';
import {
  QDSettings,
  QuickDraftSettingComponent,
} from './quick-draft-setting/quick-draft-setting.component';

@Component({
  selector: 'pdz-quick-draft',
  imports: [
    PageComponent,
    PageHeaderComponent,
    QuickDraftFinalComponent,
    QuickDraftPicksComponent,
    QuickDraftSettingComponent,
  ],
  templateUrl: './quick-draft.component.html',
  styleUrl: './quick-draft.component.scss',
})
export class QuickDraftComponent {
  draftSettings?: QDSettings | null = null;
  finalDraft?: QDPokemon[] | null = null;

  updateSettings(event: QDSettings | undefined) {
    this.draftSettings = event;
  }

  updateFinalDraft(event?: QDPokemon[]) {
    this.finalDraft = event;
  }

  getTotalPicks() {
    return this.draftSettings?.tiers.reduce(
      (count, tier) => count + tier[1],
      0,
    );
  }

  restartDraft() {
    this.draftSettings = null;
    this.finalDraft = null;
  }
}
