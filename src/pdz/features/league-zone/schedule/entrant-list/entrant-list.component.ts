import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import {
  ScheduleContext,
  placeLabel,
  placesFrom,
  projectedTeam,
  usedTeams,
} from '../schedule-entrants';
import { ScheduleEntrant, ScheduleTeam, isElimination } from '../schedule.model';

type Panel = 'teams' | 'standings' | null;
type PlaceOrder = 'by-place' | 'by-stage';

interface Suggestion {
  label: string;
  icon: string;
  entrants: () => ScheduleEntrant[];
}

@Component({
  selector: 'pdz-entrant-list',
  imports: [
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    IconComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entrant-list.component.html',
  styleUrl: './entrant-list.component.scss',
})
export class EntrantListComponent {
  readonly entrants = model.required<ScheduleEntrant[]>();
  readonly random = model(false);
  readonly canRandom = input(true);
  readonly teams = input.required<ScheduleTeam[]>();
  readonly context = input.required<ScheduleContext>();
  readonly stageKey = input<string>();

  protected readonly panel = signal<Panel>(null);
  protected readonly picked = signal(new Set<string>());
  protected readonly chosenSources = signal(new Set<string>());
  protected readonly top = signal(4);
  protected readonly order = signal<PlaceOrder>('by-place');

  protected readonly sources = computed(() =>
    this.context().stages.filter((stage) => stage.key !== this.stageKey()),
  );

  private readonly teamById = computed(
    () => new Map(this.teams().map((team) => [team.teamId, team])),
  );

  protected readonly used = computed(() =>
    usedTeams(this.context().stages, this.stageKey()),
  );

  protected readonly allTeams = computed(() =>
    this.entrants().every((entrant) => entrant.kind === 'team'),
  );

  protected readonly rows = computed(() =>
    this.entrants().map((entrant) => this.describe(entrant)),
  );

  protected readonly pools = computed(() => [
    ...new Set(
      this.teams()
        .map((team) => team.poolName)
        .filter((pool): pool is string => !!pool),
    ),
  ]);

  protected readonly available = computed(() => {
    const listed = new Set(
      this.entrants()
        .filter((entrant) => entrant.kind === 'team')
        .map((entrant) => entrant.teamId),
    );
    return this.teams().filter((team) => !listed.has(team.teamId));
  });

  protected readonly chosen = computed(() =>
    this.sources().filter((stage) => this.chosenSources().has(stage.key)),
  );

  protected readonly placesToAdd = computed(() =>
    placesFrom(this.chosen(), this.top(), this.order()),
  );

  protected readonly placesPreview = computed(() =>
    this.placesToAdd()
      .map((entrant) => placeLabel(this.context(), entrant))
      .join(', '),
  );

  protected readonly suggestions = computed<Suggestion[]>(() => {
    const tables = this.sources().filter((stage) => !isElimination(stage.type));
    const sources = tables.length ? tables : this.sources();
    const names = sources.map((stage) => stage.name);
    const out: Suggestion[] = [];
    if (sources.length > 1) {
      out.push({
        label: `Top 4 from each of ${names.join(' and ')}`,
        icon: 'leaderboard',
        entrants: () => placesFrom(sources, 4, 'by-place'),
      });
      out.push({
        label: 'Top 2 from each',
        icon: 'leaderboard',
        entrants: () => placesFrom(sources, 2, 'by-place'),
      });
    } else if (sources.length === 1) {
      for (const top of [4, 8])
        out.push({
          label: `Top ${top} from ${names[0]}`,
          icon: 'leaderboard',
          entrants: () => placesFrom(sources, top, 'by-place'),
        });
    }
    if (this.teams().length)
      out.push({
        label: `All ${this.teams().length} teams`,
        icon: 'groups',
        entrants: () =>
          this.teams().map((team) => ({ kind: 'team', teamId: team.teamId })),
      });
    return out;
  });

  protected readonly randomHint = computed(() =>
    this.allTeams()
      ? 'DraftZone draws once when you save. There are no re-rolls, and the draw is recorded.'
      : 'Places from standings keep their order, so a random draw only works with teams.',
  );

  private describe(entrant: ScheduleEntrant) {
    const context = this.context();
    if (entrant.kind === 'team') {
      const team = entrant.teamId ? this.teamById().get(entrant.teamId) : null;
      return {
        icon: 'shield',
        name: team?.teamName ?? context.teams.get(entrant.teamId ?? '')?.teamName ?? 'Unknown team',
        detail: team
          ? [team.coachName, team.poolName].filter(Boolean).join(' · ')
          : '',
      };
    }
    if (entrant.kind === 'place') {
      const confirmed = entrant.teamId ? context.teams.get(entrant.teamId) : null;
      const now = projectedTeam(context, entrant);
      return {
        icon: 'leaderboard',
        name: placeLabel(context, entrant),
        detail: confirmed
          ? `Confirmed: ${confirmed.teamName}`
          : now
            ? `Currently ${now.teamName}`
            : 'Decided when that stage ends',
      };
    }
    const team = entrant.teamId ? context.teams.get(entrant.teamId) : null;
    return {
      icon: 'help',
      name: team ? team.teamName : 'Open Slot',
      detail: team ? 'Open slot' : 'Fill in a team later',
    };
  }

  protected teamDetail(team: ScheduleTeam): string {
    const used = this.used().get(team.teamId);
    return [team.poolName, used ? `in ${used}` : null]
      .filter(Boolean)
      .join(' · ');
  }

  private set(entrants: ScheduleEntrant[]): void {
    this.entrants.set(entrants);
    if (!entrants.every((entrant) => entrant.kind === 'team'))
      this.random.set(false);
  }

  protected apply(suggestion: Suggestion): void {
    this.set(suggestion.entrants());
  }

  protected move(index: number, delta: number): void {
    const list = [...this.entrants()];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.set(list);
  }

  protected remove(index: number): void {
    this.set(this.entrants().filter((_, i) => i !== index));
  }

  protected clear(): void {
    this.set([]);
  }

  protected addOpen(): void {
    this.set([...this.entrants(), { kind: 'open' }]);
  }

  protected toggle(panel: Panel): void {
    this.panel.set(this.panel() === panel ? null : panel);
    this.picked.set(new Set());
    if (panel === 'standings' && this.chosenSources().size === 0)
      this.chosenSources.set(new Set(this.sources().map((stage) => stage.key)));
  }

  protected togglePick(teamId: string): void {
    const next = new Set(this.picked());
    if (next.has(teamId)) next.delete(teamId);
    else next.add(teamId);
    this.picked.set(next);
  }

  protected pickPool(pool: string): void {
    const next = new Set(this.picked());
    for (const team of this.available())
      if (team.poolName === pool) next.add(team.teamId);
    this.picked.set(next);
  }

  protected addPicked(): void {
    const picked = this.picked();
    this.set([
      ...this.entrants(),
      ...this.available()
        .filter((team) => picked.has(team.teamId))
        .map((team): ScheduleEntrant => ({ kind: 'team', teamId: team.teamId })),
    ]);
    this.picked.set(new Set());
    this.panel.set(null);
  }

  protected toggleSource(key: string): void {
    const next = new Set(this.chosenSources());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.chosenSources.set(next);
  }

  protected setTop(value: string): void {
    const top = Math.floor(Number(value));
    if (Number.isFinite(top) && top > 0) this.top.set(Math.min(64, top));
  }

  protected addPlaces(): void {
    const existing = new Set(
      this.entrants()
        .filter((entrant) => entrant.kind === 'place')
        .map((entrant) => `${entrant.sourceStageKey}:${entrant.place}`),
    );
    this.set([
      ...this.entrants(),
      ...this.placesToAdd().filter(
        (entrant) => !existing.has(`${entrant.sourceStageKey}:${entrant.place}`),
      ),
    ]);
    this.panel.set(null);
  }
}
