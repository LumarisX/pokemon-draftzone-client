import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { toPSString } from '../../../drafts/matchup-overview/widgets/teambuilder/teambuilder.utils';
import { DRAFT_OVERVIEW_PATH, TOOLS_PATH } from '@pdz/core/route-paths';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { QDPokemon } from '../quick-draft-picks/quick-draft-picks.component';
import { QDSettings } from '../quick-draft-setting/quick-draft-setting.component';
import { typeColor } from '@pdz/core/utils/styling';
import { AuthService } from '@pdz/core/services/auth0.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'pdz-quick-draft-final',
  imports: [SpriteComponent, MatButtonModule, RouterLink, AsyncPipe],
  templateUrl: './quick-draft-final.component.html',
  styleUrls: [
    './quick-draft-final.component.scss',
    '../quick-draft.component.scss',
  ],
})
export class QuickDraftFinalComponent {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  @Input({ required: true })
  draft!: QDPokemon[];

  @Input({ required: true })
  settings!: QDSettings;

  @Output()
  restartDraft = new EventEmitter<void>();

  draftPath = DRAFT_OVERVIEW_PATH;
  toolsPath = TOOLS_PATH;

  get teamIds() {
    return this.draft.map((pokemon) => pokemon.id);
  }

  typeColor = typeColor;

  toPokepaste() {
    this.newPokepaste(
      this.draft.map((pokemon) => pokemon.name).join('\n'),
    ).subscribe((response) => {
      console.log(response);
    });
  }

  restart() {
    this.restartDraft.emit();
  }

  get loggedInUser() {
    return this.authService.user$;
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

  newPokepaste(
    paste: string,
    options: {
      title?: string;
      user?: string;
      notes?: string;
      teamPrivacy?: boolean;
    } = {},
  ) {
    return this.http.post('https://pokepast.es/create', {
      title: options.title,
      paste: paste,
      author: options.user || 'Pokemon DraftZone User',
      notes: options.notes + '\nCreated using Pokemon DraftZone',
      teamprivacy: options.teamPrivacy ? 'on' : 'off',
    });
  }
}
