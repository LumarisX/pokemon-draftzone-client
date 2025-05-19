import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QDPokemon } from '../quick-draft-picks/quick-draft-picks.component';
import { QDSettings } from '../quick-draft-setting/quick-draft-setting.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { typeColor } from '../../../util/styling';
import { MatButtonModule } from '@angular/material/button';
import { ThirdPartyToolService } from '../../../services/tpt.service';
import { RouterLink } from '@angular/router';
import { DraftOverviewPath } from '../../../drafts/draft-overview/draft-overview-routing.module';
import { ToolsPath } from '../../tools.router';

@Component({
  selector: 'pdz-quick-draft-final',
  imports: [SpriteComponent, MatButtonModule, RouterLink],
  templateUrl: './quick-draft-final.component.html',
  styleUrls: [
    './quick-draft-final.component.scss',
    '../quick-draft.component.scss',
  ],
})
export class QuickDraftFinalComponent {
  @Input({ required: true })
  draft!: QDPokemon[];

  @Input({ required: true })
  settings!: QDSettings;

  @Output()
  restartDraft = new EventEmitter<void>();

  draftPath = DraftOverviewPath;
  toolsPath = ToolsPath;

  constructor(private tptService: ThirdPartyToolService) {}

  get teamIds() {
    return this.draft.map((pokemon) => pokemon.id);
  }

  typeColor = typeColor;

  toPokepaste() {
    this.tptService
      .newPokepaste(this.draft.map((pokemon) => pokemon.name).join('\n'))
      .subscribe((response) => {
        console.log(response);
      });
  }

  restart() {
    this.restartDraft.emit();
  }
}
