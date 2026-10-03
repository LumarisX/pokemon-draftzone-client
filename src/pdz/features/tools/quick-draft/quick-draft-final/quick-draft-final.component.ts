import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toPSString } from '../quick-draft.utils';
import { DRAFT_OVERVIEW_PATH, TOOLS_PATH } from '@pdz/core/route-paths';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { QDPokemon } from '../quick-draft-picks/quick-draft-picks.component';
import { QDSettings } from '../quick-draft-setting/quick-draft-setting.component';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { AuthService } from '@pdz/core/services/auth0.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-quick-draft-final',
  imports: [
    AsyncPipe,
    ButtonComponent,
    PokemonTypeComponent,
    RouterLink,
    SpriteComponent,
  ],
  templateUrl: './quick-draft-final.component.html',
  styleUrls: [
    './quick-draft-final.component.scss',
    '../quick-draft.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickDraftFinalComponent {
  private authService = inject(AuthService);

  readonly draft = input.required<QDPokemon[]>();
  readonly settings = input.required<QDSettings>();
  readonly restartDraft = output<void>();

  readonly draftPath = DRAFT_OVERVIEW_PATH;
  readonly toolsPath = TOOLS_PATH;
  readonly loggedInUser = this.authService.user$;
  readonly notes = 'Format: gen9natdexdraft\n- Made using Pokemon DraftZone';

  readonly teamIds = computed(() => this.draft().map((pokemon) => pokemon.id));
  readonly teamPaste = computed(() =>
    this.draft()
      .map((pokemon) => toPSString(pokemon))
      .join('\n'),
  );

  restart() {
    this.restartDraft.emit();
  }
}
