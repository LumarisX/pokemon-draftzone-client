import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import {
  SeasonMvpComponent,
  SeasonMvpStat,
} from '@pdz/shared/data/season-mvp/season-mvp.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

export type TeamRosterLine = {
  pokemon: Pokemon<DraftOptions>;
  brought: number;
  kills: number;
  indirect?: number;
  deaths: number;
  cost?: number;
  types?: readonly string[];
  offList?: boolean;
};

export function knockoutsOf(line: TeamRosterLine): number {
  return line.kills + (line.indirect ?? 0);
}

export function killRatio(line: TeamRosterLine): string {
  const knockouts = knockoutsOf(line);
  if (line.deaths) return (knockouts / line.deaths).toFixed(1);
  return knockouts > 0 ? `${knockouts}` : '—';
}

export function pickMvp(lines: readonly TeamRosterLine[]): TeamRosterLine | null {
  const [top] = [...lines].sort(
    (a, b) =>
      knockoutsOf(b) - knockoutsOf(a) ||
      a.deaths - b.deaths ||
      a.brought - b.brought,
  );
  return top && knockoutsOf(top) > 0 ? top : null;
}

export function mvpStats(
  mvp: TeamRosterLine,
  lines: readonly TeamRosterLine[],
): SeasonMvpStat[] {
  const knockouts = knockoutsOf(mvp);
  const teamKnockouts = lines.reduce((sum, line) => sum + knockoutsOf(line), 0);
  return [
    { label: 'Games', value: mvp.brought },
    { label: 'Fainted', value: mvp.deaths },
    {
      label: 'KOs/Game',
      value: mvp.brought ? (knockouts / mvp.brought).toFixed(1) : '—',
    },
    {
      label: 'Team KOs',
      value: teamKnockouts
        ? `${Math.round((knockouts / teamKnockouts) * 100)}%`
        : '—',
    },
  ];
}

let nextRosterId = 0;

@Component({
  selector: 'pdz-team-roster',
  imports: [
    CardComponent,
    ChipComponent,
    PokemonComponent,
    SeasonMvpComponent,
    TooltipDirective,
  ],
  templateUrl: './team-roster.component.html',
  styleUrl: './team-roster.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamRosterComponent {
  readonly lines = input.required<readonly TeamRosterLine[]>();
  readonly heading = input('Draft Roster');

  protected readonly headingId = `pdz-team-roster-${nextRosterId++}`;
  protected readonly ratio = killRatio;

  protected readonly showIndirect = computed(() =>
    this.lines().some((line) => line.indirect !== undefined),
  );

  protected readonly totals = computed(() => {
    const lines = this.lines();
    const priced = lines.some((line) => line.cost !== undefined);
    return lines.reduce(
      (sum, line) => ({
        cost: sum.cost === null ? null : sum.cost + (line.cost ?? 0),
        kills: sum.kills + line.kills,
        indirect: sum.indirect + (line.indirect ?? 0),
        deaths: sum.deaths + line.deaths,
      }),
      { cost: priced ? 0 : null, kills: 0, indirect: 0, deaths: 0 } as {
        cost: number | null;
        kills: number;
        indirect: number;
        deaths: number;
      },
    );
  });

  protected readonly mvp = computed(() => {
    const lines = this.lines();
    const line = pickMvp(lines);
    if (!line) return null;
    const detail = this.showIndirect()
      ? `${line.kills} direct · ${line.indirect ?? 0} indirect`
      : line.cost !== undefined
        ? `${line.cost} pts`
        : '';
    return {
      line,
      knockouts: knockoutsOf(line),
      detail,
      stats: mvpStats(line, lines),
    };
  });
}
