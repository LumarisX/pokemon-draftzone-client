import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { toPSString } from '../../../../../utils/teambuilder.utils';
import { DraftOverviewPath } from '../../../drafts/draft-overview/draft-overview-routing.module';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { AuthService } from '../../../services/auth0.service';
import { ThirdPartyToolService } from '../../../services/tpt.service';
import { typeColor } from '../../../util/styling';
import { ToolsPath } from '../../tools.router';
import { QDPokemon } from '../quick-draft-picks/quick-draft-picks.component';
import { QDSettings } from '../quick-draft-setting/quick-draft-setting.component';

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

  constructor(
    private tptService: ThirdPartyToolService,
    private authService: AuthService,
  ) {}

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

  get loggedInUser(): string {
    return this.authService._userSubject.value?.username ?? 'Pokemon DraftZone';
  }

  get teamPaste() {
    return this.draft.map((pokemon) => toPSString(pokemon)).join('\n');
  }

  get psformat() {
    return this.settings.format;
  }

  get notes() {
    //TODO: add psformat to format
    return `Format: gen9natdexdraft\n- Made using Pokemon DraftZone`;
  }
}
