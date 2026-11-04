import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { KoGraphPokemon, KoGraphRosters } from './ko-graph.component';
import {
  KO_SHEET_MAX,
  KO_SIDES,
  KoSheets,
  KoSide,
  koKey,
  toggleSheetKey,
} from './ko-graph.model';

type SheetPick = {
  key: string;
  pokemon: KoGraphPokemon;
  label: string;
  picked: boolean;
};

@Component({
  selector: 'pdz-team-sheets',
  templateUrl: './team-sheets.component.html',
  styleUrl: './team-sheets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RosterSpritesComponent, SpriteComponent, TooltipDirective],
})
export class TeamSheetsComponent {
  readonly rosters = input.required<KoGraphRosters>();
  readonly sideNames = input.required<Record<KoSide, string>>();
  readonly editing = input(false, { transform: booleanAttribute });
  readonly sheets = model.required<KoSheets>();

  protected readonly sides = KO_SIDES;
  protected readonly max = KO_SHEET_MAX;

  private readonly rosterKeys = computed<Record<KoSide, string[]>>(() => {
    const rosters = this.rosters();
    return {
      side1: rosters.side1.map((pokemon) => koKey('side1', pokemon.id)),
      side2: rosters.side2.map((pokemon) => koKey('side2', pokemon.id)),
    };
  });

  protected readonly picks = computed<Record<KoSide, SheetPick[]>>(() => {
    const rosters = this.rosters();
    const sheets = this.sheets();
    const build = (side: KoSide): SheetPick[] =>
      rosters[side].map((pokemon) => {
        const key = koKey(side, pokemon.id);
        return {
          key,
          pokemon,
          label: pokemon.nickname || pokemon.name,
          picked: sheets[side].includes(key),
        };
      });
    return { side1: build('side1'), side2: build('side2') };
  });

  protected readonly picked = computed<Record<KoSide, KoGraphPokemon[]>>(
    () => {
      const picks = this.picks();
      const only = (side: KoSide) =>
        picks[side].filter((pick) => pick.picked).map((pick) => pick.pokemon);
      return { side1: only('side1'), side2: only('side2') };
    },
  );

  protected isFull(side: KoSide): boolean {
    return this.sheets()[side].length >= KO_SHEET_MAX;
  }

  protected toggle(side: KoSide, key: string): void {
    this.sheets.update((sheets) => ({
      ...sheets,
      [side]: toggleSheetKey(sheets[side], this.rosterKeys()[side], key),
    }));
  }
}
